import { Router } from "express";
import languages from "../data/languages.json";
import locations from "../data/locations-india.json";
import knowledgeBase from "../data/knowledge-base.json";

export const referenceRouter = Router();

/** GET /reference/languages — the 10 languages + English for the language picker screen. */
referenceRouter.get("/languages", (_req, res) => {
  res.json(languages.languages);
});

/** GET /reference/states — India states/UTs for the location picker screen. */
referenceRouter.get("/states", (_req, res) => {
  res.json(locations.states);
});

/**
 * GET /reference/crops — lightweight crop list for the crop-picker grid
 * (id, names, category) without the full pest/disease payload.
 */
referenceRouter.get("/crops", (_req, res) => {
  const list = knowledgeBase.crops.map((c) => ({
    id: c.id,
    name_en: c.name_en,
    name_hi: c.name_hi,
    category: c.category,
    major_states: c.major_states,
  }));
  res.json(list);
});
