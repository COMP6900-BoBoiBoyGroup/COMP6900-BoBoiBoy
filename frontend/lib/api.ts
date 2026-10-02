// lib/api.ts
//
// Small helper that the page component calls to send the chosen photo to
// our own /api/predict route. Keeping this in its own function (instead of
// writing the fetch call straight inside the component) just makes
// app/page.tsx easier to read.

import { PredictionError, PredictionResult } from "./types";

// Sends the image file to /api/predict and returns the prediction.
// If anything goes wrong, it throws a plain Error with a message that is
// safe to show to the user.
export async function identifyFruit(file: File): Promise<PredictionResult> {
  // "image" is the field name our /api/predict route expects the file
  // under (see app/api/predict/route.ts).
  const formData = new FormData();
  formData.append("image", file);

  let response: Response;
  try {
    response = await fetch("/api/predict", {
      method: "POST",
      body: formData,
    });
  } catch {
    // This usually means the user is offline or the server can't be reached.
    throw new Error(
      "Could not reach the server. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    // Try to read a helpful message from the error response body.
    const errorBody = (await response.json().catch(() => null)) as
      | PredictionError
      | null;
    throw new Error(
      errorBody?.error ?? `Request failed with status ${response.status}.`
    );
  }

  const data = (await response.json()) as PredictionResult;
  return data;
}
