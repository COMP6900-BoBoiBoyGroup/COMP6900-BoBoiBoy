// lib/types.ts
//
// Shared TypeScript types used across the frontend. Keeping these in one
// place means the UI components, the API route, and the fruit info database
// all agree on the exact shape of a "prediction".

/**
 * The set of fruit labels our CNN backend currently supports.
 * Project 4's bare-minimum scope is apple + banana only; the "unknown"
 * value lets the UI gracefully handle low-confidence or unrecognised
 * results instead of crashing.
 */
export type FruitLabel = "apple" | "banana" | "unknown";

/**
 * The JSON shape returned by our own `/api/predict` route (and, by
 * extension, expected from the backend model API it proxies to).
 *
 * confidence is a 0-1 probability for the predicted label, as most
 * softmax-based CNN classifiers (e.g. a Keras/TensorFlow model with a
 * final softmax layer) naturally output.
 */
export interface PredictionResult {
  label: FruitLabel;
  confidence: number; // 0..1
}

/** Error shape returned by /api/predict when something goes wrong. */
export interface PredictionError {
  error: string;
}

/**
 * Static reference information shown to the user once a fruit has been
 * identified. This content fulfils requirement (4) of the project brief:
 * nutrition facts, health benefits, ripeness tips, and usage/serving ideas.
 *
 * This lives on the frontend (rather than coming from the backend) because
 * it is fixed reference content, not something the CNN model predicts -
 * keeping it here means the backend only needs to return a label +
 * confidence, which keeps the model API simple.
 */
export interface FruitInfo {
  label: FruitLabel;
  displayName: string;
  emoji: string;
  summary: string;
  nutrition: { label: string; value: string }[];
  healthBenefits: string[];
  ripenessTips: string[];
  usageIdeas: string[];
}
