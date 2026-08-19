import { Router } from "express";
import db from "../db";
import knowledgeBase from "../data/knowledge-base.json";
import { requireAuth, AuthedRequest } from "../auth/middleware";
import { diagnose, getSignLibrary, scaleNote, MatchedIssue } from "../services/diagnosisEngine";
import * as llmVision from "../services/llmVision";

export const diagnosisRouter = Router();

/** GET /diagnosis/signs — sign vocabulary for the checklist screen. */
diagnosisRouter.get("/signs", (_req, res) => {
  res.json(getSignLibrary());
});

/** GET /diagnosis/crops/:cropId — full crop record (pests/diseases/deficiencies) for reference/detail views. */
diagnosisRouter.get("/crops/:cropId", (req, res) => {
  const crop = (knowledgeBase.crops as any[]).find((c) => c.id === req.params.cropId);
  if (!crop) return res.status(404).json({ error: "UNKNOWN_CROP_ID" });
  res.json(crop);
});

/** GET /diagnosis/vision-status — lets the app know whether to show the "take a photo" option. */
diagnosisRouter.get("/vision-status", (_req, res) => {
  res.json({
    enabled: true,
    provider: llmVision.getActiveProvider(),
  });
});

/**
 * POST /diagnosis (auth required)
 * body: { cropId, organ?, signIds?: string[], imageBase64?, imageMediaType?, stateCode?, acreage? }
 * Either signIds (manual checklist) or imageBase64 (photo analysed with Multimodal LLM Vision).
 */
diagnosisRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { cropId, organ, signIds, imageBase64, imageMediaType, stateCode, acreage } = req.body || {};
  if (!cropId) return res.status(400).json({ error: "CROP_ID_REQUIRED" });

  const crop = (knowledgeBase.crops as any[]).find((c) => c.id === cropId);
  if (!crop) return res.status(400).json({ error: "UNKNOWN_CROP_ID" });

  let finalSignIds: string[] = Array.isArray(signIds) ? signIds : [];
  let visionAnalysis: llmVision.VisionDiagnosisResult | null = null;
  let inputMode: "symptom_checklist" | "photo" = "symptom_checklist";
  let computedPlantHealthIndex = 100;
  let matches: MatchedIssue[] = [];

  if (imageBase64) {
    inputMode = "photo";
    try {
      visionAnalysis = await llmVision.analysePlantPhoto(
        imageBase64,
        imageMediaType || "image/jpeg",
        crop.name_en,
        organ,
        stateCode
      );

      if (visionAnalysis.signIds && visionAnalysis.signIds.length > 0) {
        finalSignIds = visionAnalysis.signIds;
      }
      computedPlantHealthIndex = visionAnalysis.plantHealthIndex;

      // Check if rule engine can match any curated knowledgeBase items
      const ruleResult = diagnose(cropId, finalSignIds);
      if (ruleResult.matches && ruleResult.matches.length > 0) {
        matches = ruleResult.matches;
      } else {
        // Construct structured issue from LLM vision analysis
        matches = [
          {
            crop_id: cropId,
            type: visionAnalysis.issueType,
            name_en: visionAnalysis.detectedIssue,
            name_hi: visionAnalysis.detectedIssueHi,
            confidence: visionAnalysis.confidence,
            severity: visionAnalysis.severity,
            details: {
              symptoms: visionAnalysis.visualDescription,
              correction_foliar: visionAnalysis.tier1_cultural_mineral,
              biological: visionAnalysis.tier2_biological,
              chemical_class_generic: visionAnalysis.tier3_chemical_class,
            },
          },
        ];
      }
    } catch (e: any) {
      return res.status(502).json({ error: e.message || "VISION_FAILED" });
    }
  } else {
    if (finalSignIds.length === 0) {
      return res.status(400).json({ error: "NO_SIGNS_PROVIDED" });
    }
    const ruleResult = diagnose(cropId, finalSignIds);
    computedPlantHealthIndex = ruleResult.plantHealthIndex;
    matches = ruleResult.matches;
  }

  db.prepare(
    `INSERT INTO diagnoses (user_id, crop_id, organ, input_mode, symptoms_json, state_code, acreage, plant_health_index, matched_issues_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user!.id,
    cropId,
    organ || null,
    inputMode,
    JSON.stringify(finalSignIds),
    stateCode || null,
    acreage || null,
    computedPlantHealthIndex,
    JSON.stringify(matches)
  );

  res.json({
    ok: true,
    cropId,
    cropName: crop.name_en,
    inputMode,
    visionNote: visionAnalysis ? visionAnalysis.visualDescription : null,
    visionAnalysis,
    plantHealthIndex: computedPlantHealthIndex,
    matches,
    dosageScalingNote: scaleNote(acreage),
    disclaimer:
      "Guidance synthesized using agricultural knowledge base and AI vision advisory. Always confirm registered active ingredients with your local KVK or SAU before chemical application.",
  });
});

/** GET /diagnosis/history (auth required) — the logged-in farmer's past diagnoses. */
diagnosisRouter.get("/history", requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare(`SELECT * FROM diagnoses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(req.user!.id) as any[];

  res.json(
    rows.map((r) => ({
      id: r.id,
      cropId: r.crop_id,
      organ: r.organ,
      inputMode: r.input_mode,
      plantHealthIndex: r.plant_health_index,
      matches: JSON.parse(r.matched_issues_json),
      createdAt: r.created_at,
    }))
  );
});
