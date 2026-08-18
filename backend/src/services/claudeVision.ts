import { SIGN_LIBRARY } from "./diagnosisEngine";

/**
 * Optional photo-diagnosis assist. If ANTHROPIC_API_KEY is not set, `isEnabled()` returns
 * false and the diagnosis route falls back to the manual symptom-checklist flow only —
 * the app is fully usable without this.
 *
 * Design note: this deliberately asks Claude to identify which entries from the app's own
 * SIGN_LIBRARY are visible in the photo (a fixed, closed vocabulary), rather than asking
 * for a free-text diagnosis or a specific pesticide/dose. That keeps the authoritative
 * recommendation logic in diagnosisEngine.ts / knowledge-base.json, where it can be
 * reviewed and updated by an agronomist, instead of inside a model prompt.
 */

export function isEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function extractSignsFromPhoto(
  imageBase64: string,
  mediaType: string,
  cropNameEn: string,
  organHint?: string
): Promise<{ signIds: string[]; note: string }> {
  if (!isEnabled()) {
    throw new Error("VISION_NOT_CONFIGURED");
  }

  const signList = SIGN_LIBRARY.map((s) => `- ${s.id}: ${s.label_en}`).join("\n");

  const systemPrompt = `You are assisting a farm-diagnostic app. You will be shown a photo of a ${cropNameEn} plant${
    organHint ? ` (${organHint})` : ""
  }. Choose ONLY from this fixed list of observable sign IDs — do not invent new ones, do not name a pest/disease/pesticide, and do not give a dose:
${signList}

Respond with ONLY a JSON object, no prose, no markdown fences:
{"sign_ids": ["..."], "note": "one short plain-language sentence describing what is visible, for the farmer"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: "Identify the visible signs from the fixed list." },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`VISION_API_ERROR_${response.status}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b: any) => b.type === "text");
  if (!textBlock) throw new Error("VISION_NO_TEXT_RESPONSE");

  let parsed: { sign_ids?: string[]; note?: string };
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("VISION_RESPONSE_NOT_JSON");
  }

  const validIds = new Set(SIGN_LIBRARY.map((s) => s.id));
  const signIds = (parsed.sign_ids || []).filter((id) => validIds.has(id as any));

  return { signIds, note: parsed.note || "" };
}
