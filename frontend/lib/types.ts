// lib/types.ts
//
// Shared TypeScript types used across the frontend. Putting them in one
// file means the UI components, the API route, and the fruit info list all
// agree on what a "prediction" looks like.

// The fruit labels our model can return. The project brief only requires
// apple and banana to start with - "unknown" is used when the model/photo
// doesn't look like either one.
export type FruitLabel = "apple" | "banana" | "unknown";

// The JSON shape returned by our own /api/predict route.
// confidence is a number from 0 to 1 (e.g. 0.9 means 90% sure).
export interface PredictionResult {
  label: FruitLabel;
  confidence: number;
}

// Shape of the error JSON returned by /api/predict when something goes wrong.
export interface PredictionError {
  error: string;
}

// Info shown to the user once a fruit has been identified: nutrition facts,
// health benefits, ripeness tips, and ideas for how to use/eat the fruit.
export interface FruitInfo {
  displayName: string;
  emoji: string;
  summary: string;
  nutrition: { label: string; value: string }[];
  healthBenefits: string[];
  ripenessTips: string[];
  usageIdeas: string[];
}
