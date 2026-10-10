// lib/types.ts
//
// This file holds the TypeScript types that are shared across the
// frontend, so the components, the API route, and the fruit info list
// all agree on what a "prediction" looks like.

// This is every label our model can give back. The project only needs
// apple and banana, and "unknown" is used when the photo doesn't look
// like either one.
export type FruitLabel = "apple" | "banana" | "unknown";

// This is the shape of the JSON our own /api/predict route returns.
// confidence is a number from 0 to 1 (so 0.9 means "90% sure").
export interface PredictionResult {
  label: FruitLabel;
  confidence: number;
}

// This is the shape of the error JSON /api/predict returns when
// something goes wrong.
export interface PredictionError {
  error: string;
}

// This holds everything we show the user once a fruit has been
// identified: nutrition facts, health benefits, ripeness tips, and ideas
// for how to use/eat it.
export interface FruitInfo {
  displayName: string;
  emoji: string;
  summary: string;
  nutrition: { label: string; value: string }[];
  healthBenefits: string[];
  ripenessTips: string[];
  usageIdeas: string[];
}
