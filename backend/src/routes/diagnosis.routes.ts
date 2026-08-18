import { Router } from "express";
import db from "../db";
import knowledgeBase from "../data/knowledge-base.json";
import { requireAuth, AuthedRequest } from "../auth/middleware";
import { diagnose, getSignLibrary, scaleNote } from "../services/diagnosisEngine";
import * as claudeVision from "../services/claudeVision";

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

/** GET /diagnosis/vision-status — lets the app know whether to show the "take a photo" option or checklist-only. */
diagnosisRouter.get("/vision-status", (_req, res) => {
  res.json({ enabled: claudeVision.isEnabled() });
});

/**
 * POST /diagnosis (auth required)
 * body: { cropId, organ?, signIds?: string[], imageBase64?, imageMediaType?, stateCode?, acreage? }
 * Either signIds (manual checklist) or imageBase64 (photo, requires ANTHROPIC_API_KEY set
 * server-side) must be provided. Persists the diagnosis to history for the logged-in farmer.
 */
diagnosisRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const { cropId, organ, signIds, imageBase64, imageMediaType, stateCode, acreage } = req.body || {};
  if (!cropId) return res.status(400).json({ error: "CROP_ID_REQUIRED" });

  const crop = (knowledgeBase.crops as any[]).find((c) => c.id === cropId);
  if (!crop) return res.status(400).json({ error: "UNKNOWN_CROP_ID" });

  let finalSignIds: string[] = Array.isArray(signIds) ? signIds : [];
  let visionNote: string | null = null;
  let inputMode: "symptom_checklist" | "photo" = "symptom_checklist";

  if (imageBase64) {
    inputMode = "photo";
    if (!claudeVision.isEnabled()) {
      return res.status(400).json({ error: "PHOTO_DIAGNOSIS_NOT_CONFIGURED" });
    }
    try {
      const result = await claudeVision.extractSignsFromPhoto(
        imageBase64,
        imageMediaType || "image/jpeg",
        crop.name_en,
        organ
      );
      finalSignIds = result.signIds;
      visionNote = result.note;
    } catch (e: any) {
      return res.status(502).json({ error: e.message || "VISION_FAILED" });
    }
  }

  if (finalSignIds.length === 0) {
    return res.status(400).json({ error: "NO_SIGNS_PROVIDED" });
  }

  const { plantHealthIndex, matches } = diagnose(cropId, finalSignIds);

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
    plantHealthIndex,
    JSON.stringify(matches)
  );

  res.json({
    ok: true,
    cropId,
    cropName: crop.name_en,
    inputMode,
    visionNote,
    plantHealthIndex,
    matches,
    dosageScalingNote: scaleNote(acreage),
    disclaimer:
      "This is a seed/demo knowledge base, not verified ICAR/CIB&RC field advice. Confirm any chemical control against your current state advisory or KVK before purchase or use.",
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
