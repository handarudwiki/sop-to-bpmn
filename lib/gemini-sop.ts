// =============================================================================
// Gemini-powered SOP → BPMN step extraction
// =============================================================================
// Uses the Google Gen AI SDK (@google/genai) with the gemini-3.7-flash model
// to read a free-form Standard Operating Procedure (any language, numbered
// list or prose) and extract a structured list of workflow steps.
//
// We ask the model for STRUCTURED JSON (not raw XML) so we can deterministically
// build valid BPMN 2.0 XML ourselves — this keeps the downstream parser happy
// while still getting the language-understanding benefits of an LLM.
// =============================================================================

import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-3.7-flash";

/** A single extracted workflow step. */
export interface ExtractedStep {
  /** Short imperative task name, e.g. "Manager approves leave request". */
  name: string;
  /** Longer description / documentation for the task. */
  description: string;
  /** Whether this step is a decision/approval that should branch the flow. */
  isDecision: boolean;
}

export interface ExtractedProcess {
  steps: ExtractedStep[];
}

/** How the steps were produced. */
export type ExtractionSource = "ai" | "static";

export interface ExtractionResult {
  steps: ExtractedStep[];
  source: ExtractionSource;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      description: "Ordered list of workflow steps extracted from the SOP.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description:
              "Short imperative task name (max ~8 words). Keep the SOP's original language.",
          },
          description: {
            type: Type.STRING,
            description: "One sentence describing what happens in this step.",
          },
          isDecision: {
            type: Type.BOOLEAN,
            description:
              "True if this step is an approval/verification/review/decision that can be accepted or rejected and should create a gateway.",
          },
        },
        required: ["name", "description", "isDecision"],
        propertyOrdering: ["name", "description", "isDecision"],
      },
    },
  },
  required: ["steps"],
};

const SYSTEM_INSTRUCTION = `You are a business process analyst. You convert Standard Operating Procedures (SOPs) into a clean, ordered list of workflow steps for a BPMN engine.

Rules:
- Extract each distinct action a person performs as one step, in execution order.
- Works with numbered lists, bullet points, or free-flowing prose.
- Preserve the original language of the SOP in the "name" and "description".
- Mark a step as a decision (isDecision=true) only when it is an approval, verification, review, validation, or any accept/reject choice that could branch the flow.
- Do NOT invent steps that are not implied by the SOP. Do NOT include a generic "Start" or "End" step; those are added automatically.
- Keep task names concise and action-oriented.`;

// ---------------------------------------------------------------------------
// Static-rule fallback — the original keyword/regex-based extractor.
// Used when no API key is configured, so the app still works offline.
// ---------------------------------------------------------------------------

const DECISION_KEYWORDS = [
  // English
  "approv",
  "verif",
  "review",
  "check",
  "validat",
  "confirm",
  // Indonesian
  "setuju",
  "verifikasi",
  "tinjau",
  "periksa",
  "validasi",
  "konfirmasi",
  "memeriksa",
  "menyetujui",
];

/**
 * extractStepsStatic — splits SOP text into steps using simple regex rules.
 * Supports "1. Step", "2) Step", "Step 1:", "- Step", "• Step".
 */
export function extractStepsStatic(sopText: string): ExtractedStep[] {
  const lines = sopText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const steps: ExtractedStep[] = [];
  for (const line of lines) {
    const clean = line
      .replace(/^(\d+[.)]|[-•*])\s*/, "")
      .replace(/^Step\s*\d+\s*:\s*/i, "")
      .trim();
    if (clean.length <= 2) continue;

    const lower = clean.toLowerCase();
    const isDecision = DECISION_KEYWORDS.some((k) => lower.includes(k));
    steps.push({ name: clean, description: clean, isDecision });
  }

  return steps;
}

/**
 * extractProcessFromSop — top-level extractor with graceful fallback.
 *
 * - If GEMINI_API_KEY is set, uses Gemini 3.7 Flash and returns source: "ai".
 * - If the key is missing, falls back to the static regex parser (source: "static").
 * - If the AI call itself fails, it propagates the error (the key WAS provided,
 *   so the user likely wants to know something went wrong rather than silently
 *   downgrading). Change `fallbackOnError` to true to also fall back on errors.
 */
export async function extractProcessFromSop(
  sopText: string,
  { fallbackOnError = false }: { fallbackOnError?: boolean } = {}
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // No key → static fallback immediately.
  if (!apiKey) {
    const steps = extractStepsStatic(sopText);
    if (steps.length === 0) {
      throw new Error("Could not extract any steps from the SOP text.");
    }
    return { steps, source: "static" };
  }

  try {
    const steps = await callGemini(sopText, apiKey);
    return { steps, source: "ai" };
  } catch (err) {
    if (!fallbackOnError) throw err;
    console.warn("Gemini extraction failed, falling back to static rules:", err);
    const steps = extractStepsStatic(sopText);
    if (steps.length === 0) {
      throw err instanceof Error ? err : new Error(String(err));
    }
    return { steps, source: "static" };
  }
}

/**
 * callGemini — calls Gemini 3.7 Flash to turn SOP text into structured steps.
 * Assumes the API key is present. Throws if the call fails.
 */
async function callGemini(
  sopText: string,
  apiKey: string
): Promise<ExtractedStep[]> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Convert the following SOP into structured workflow steps:\n\n${sopText}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: ExtractedProcess;
  try {
    parsed = JSON.parse(text) as ExtractedProcess;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }

  const steps = (parsed.steps || []).filter(
    (s) => s && typeof s.name === "string" && s.name.trim().length > 0
  );

  if (steps.length === 0) {
    throw new Error("Gemini could not extract any steps from the SOP text.");
  }

  return steps;
}
