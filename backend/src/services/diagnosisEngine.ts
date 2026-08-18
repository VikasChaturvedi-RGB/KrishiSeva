import knowledgeBase from "../data/knowledge-base.json";

/**
 * SIGN_LIBRARY is the vocabulary of observable, plain-language signs shown to the farmer
 * as tappable chips (symptom-checklist mode). Each sign maps to keywords that are matched
 * (case-insensitive substring) against the free-text `symptoms` field of every pest/disease/
 * deficiency entry in knowledge-base.json. This keeps the knowledge base human-readable
 * (real agronomy text) while still giving the app a simple, offline-friendly matcher —
 * no ML model required for the checklist path. The photo path (services/claudeVision.ts)
 * produces the same sign IDs from an image, then reuses this exact scorer.
 */
export const SIGN_LIBRARY = [
  { id: "yellowing_older_leaves", label_en: "Yellowing of older/lower leaves", label_hi: "निचली/पुरानी पत्तियों का पीलापन", keywords: ["yellowing", "older leaves", "lower leaves", "chlorosis"] },
  { id: "yellowing_younger_leaves", label_en: "Yellowing of new/younger leaves, veins green", label_hi: "नई पत्तियों का पीलापन, नसें हरी", keywords: ["younger leaves", "interveinal", "new leaves"] },
  { id: "holes_in_leaves", label_en: "Holes or ragged feeding damage on leaves", label_hi: "पत्तियों में छेद", keywords: ["holes", "feeding", "ragged", "skeletoniz"] },
  { id: "holes_in_fruit_pods", label_en: "Holes in fruit / pods, larva inside", label_hi: "फल/फली में छेद, अंदर सुंडी", keywords: ["holes in pod", "holes in fruit", "larva feeding inside", "feeding on developing seeds"] },
  { id: "spots_with_rings", label_en: "Spots with concentric rings on leaves", label_hi: "पत्तियों पर छल्लेदार धब्बे", keywords: ["concentric", "ring", "target spot"] },
  { id: "water_soaked_lesions", label_en: "Water-soaked patches turning brown/black", label_hi: "पानी जैसे धब्बे जो भूरे/काले हो जाते हैं", keywords: ["water-soaked", "water soaked"] },
  { id: "white_powdery_growth", label_en: "White/downy fungal growth on leaf underside", label_hi: "पत्ती के नीचे सफेद रुई जैसी फफूंद", keywords: ["white fungal", "downy", "powdery", "glistening"] },
  { id: "wilting_whole_plant", label_en: "Sudden wilting of the whole plant", label_hi: "पूरे पौधे का अचानक मुरझाना", keywords: ["wilting", "wilt", "drooping"] },
  { id: "dead_heart", label_en: "Dead/dried central shoot (dead heart)", label_hi: "बीच की कोंपल सूखना (डेड हार्ट)", keywords: ["dead heart", "central shoot dries"] },
  { id: "sticky_honeydew", label_en: "Sticky residue / black sooty mould, insects visible", label_hi: "चिपचिपा पदार्थ / काली फफूंद, कीट दिखाई देना", keywords: ["honeydew", "sooty mould", "sooty mold"] },
  { id: "curling_leaves", label_en: "Curling or twisting of leaves", label_hi: "पत्तियों का मुड़ना", keywords: ["curl", "curling", "twisting"] },
  { id: "stunted_growth", label_en: "Stunted growth / short plant", label_hi: "पौधे की बढ़वार रुकना", keywords: ["stunted", "short internode", "shortened"] },
  { id: "rotting_at_base", label_en: "Rotting at the base/collar/root", label_hi: "जड़/तने के आधार पर सड़न", keywords: ["rot", "rotting", "collar rot", "basal rot"] },
  { id: "poor_fruit_pod_filling", label_en: "Poor fruit/pod/grain filling despite healthy-looking plant", label_hi: "दाना/फली भरने में कमी", keywords: ["poor pod filling", "poor bunch filling", "unfilled pods", "reduced pod set"] },
  { id: "silvery_streaks", label_en: "Silvery streaks or bronzing on leaves", label_hi: "पत्तियों पर चांदी जैसी धारियां", keywords: ["silvery", "bronzing"] },
  { id: "marginal_scorching", label_en: "Browning/scorching along leaf margins", label_hi: "पत्ती किनारों का झुलसना", keywords: ["marginal", "margin", "scorch"] },
  { id: "mosaic_mottling", label_en: "Mosaic / mottled patchy colour pattern on leaves", label_hi: "पत्तियों पर चित्तीदार (मोज़ेक) रंग", keywords: ["mosaic", "mottl"] },
  { id: "insects_at_base", label_en: "Small insects visible near plant base / waterline", label_hi: "पौधे के आधार पर छोटे कीट दिखना", keywords: ["at plant base", "near waterline", "hopper burn"] },
  { id: "fruit_cracking_blossom_rot", label_en: "Blossom-end rot / cracked or corky fruit", label_hi: "फल का सिरा सड़ना / फटना", keywords: ["blossom end rot", "cracked", "corky"] },
] as const;

export type MatchedIssue = {
  crop_id: string;
  type: "pest" | "disease" | "nutrient_deficiency";
  name_en: string;
  name_hi?: string;
  confidence: number; // 0-100
  severity?: string;
  details: any;
};

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 10,
  medium: 20,
  "medium-high": 30,
  high: 40,
  "high (as virus vector)": 35,
  "high (as virus vector for seed crop)": 35,
};

function textMatchesSign(symptomText: string, signId: string): boolean {
  const sign = SIGN_LIBRARY.find((s) => s.id === signId);
  if (!sign) return false;
  const lower = symptomText.toLowerCase();
  return sign.keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Scores every pest/disease/nutrient-deficiency entry for a crop against the farmer's
 * selected sign IDs, and returns ranked matches. This is intentionally simple and
 * explainable (rule-based keyword overlap) rather than a black-box model, since the
 * underlying knowledge base is itself an unverified seed dataset — see
 * knowledge-base.json._meta and docs/DATA_SOURCES.md.
 */
export function diagnose(cropId: string, selectedSignIds: string[]): {
  plantHealthIndex: number;
  matches: MatchedIssue[];
} {
  const crop = (knowledgeBase.crops as any[]).find((c) => c.id === cropId);
  if (!crop) throw new Error("UNKNOWN_CROP_ID");
  if (!selectedSignIds || selectedSignIds.length === 0) {
    return { plantHealthIndex: 100, matches: [] };
  }

  const candidates: MatchedIssue[] = [];

  for (const pest of crop.pests || []) {
    const hits = selectedSignIds.filter((sid) => textMatchesSign(pest.symptoms, sid));
    if (hits.length > 0) {
      candidates.push({
        crop_id: cropId,
        type: "pest",
        name_en: pest.name_en,
        name_hi: pest.name_hi,
        confidence: Math.round((hits.length / selectedSignIds.length) * 100),
        severity: pest.severity,
        details: pest,
      });
    }
  }

  for (const disease of crop.diseases || []) {
    const hits = selectedSignIds.filter((sid) => textMatchesSign(disease.symptoms, sid));
    if (hits.length > 0) {
      candidates.push({
        crop_id: cropId,
        type: "disease",
        name_en: disease.name_en,
        confidence: Math.round((hits.length / selectedSignIds.length) * 100),
        severity: "medium", // diseases in the seed KB don't carry an explicit severity field yet
        details: disease,
      });
    }
  }

  for (const deficiency of crop.nutrient_deficiencies || []) {
    const hits = selectedSignIds.filter((sid) => textMatchesSign(deficiency.symptoms, sid));
    if (hits.length > 0) {
      candidates.push({
        crop_id: cropId,
        type: "nutrient_deficiency",
        name_en: deficiency.nutrient,
        name_hi: deficiency.local_name,
        confidence: Math.round((hits.length / selectedSignIds.length) * 100),
        severity: "medium",
        details: deficiency,
      });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const topMatches = candidates.slice(0, 5);

  // Plant Health Index: start at 100, subtract the top match's severity weight scaled by
  // how confident that match is. Multiple co-occurring issues compound the penalty a little.
  let penalty = 0;
  topMatches.slice(0, 3).forEach((m, idx) => {
    const weight = SEVERITY_WEIGHT[m.severity || "medium"] ?? 20;
    const decay = idx === 0 ? 1 : idx === 1 ? 0.5 : 0.25; // secondary matches count less
    penalty += weight * (m.confidence / 100) * decay;
  });
  const plantHealthIndex = Math.max(0, Math.round(100 - penalty));

  return { plantHealthIndex, matches: topMatches };
}

/** Returns the sign vocabulary — used by the frontend to render the checklist chips. */
export function getSignLibrary() {
  return SIGN_LIBRARY;
}

/**
 * Scales a generic "X per acre" style instruction by the farmer's reported field size.
 * Kept deliberately generic (unit-only) since real per-acre rates must come from a
 * verified SAU/CIB&RC source, not this seed dataset — see knowledge-base.json._meta.
 */
export function scaleNote(acreage: number | undefined): string | null {
  if (!acreage || acreage <= 0) return null;
  return `Quantities in official recommendations are typically given per acre or per hectare — multiply the verified per-acre rate by ${acreage} for this field. Always confirm the current rate with your KVK/SAU source before applying.`;
}
