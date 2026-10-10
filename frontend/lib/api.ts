// lib/api.ts
//
// This file has one function that the page uses to send a photo to our
// own /api/predict route and get back a result. It's kept in its own
// file (instead of writing the fetch call directly inside the page) just
// so app/page.tsx stays shorter and easier to read.

import { PredictionError, PredictionResult } from "./types";

// Sends the photo to /api/predict and returns the prediction we get back.
// If anything goes wrong, this throws a plain Error with a message that's
// safe to show directly to the user.
export async function identifyFruit(file: File): Promise<PredictionResult> {
  // "image" is the field name our /api/predict route expects the file to
  // be under - see app/api/predict/route.ts.
  const formData = new FormData();
  formData.append("image", file);

  let response: Response;
  try {
    response = await fetch("/api/predict", {
      method: "POST",
      body: formData,
    });
  } catch {
    // fetch only throws here if the request couldn't even be sent, e.g.
    // the user is offline.
    throw new Error(
      "Could not reach the server. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    // Try to read an error message out of the response body, if there is one.
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
