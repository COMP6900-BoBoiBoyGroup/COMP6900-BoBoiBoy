// lib/api.ts
//
// Small client-side helper for calling our own `/api/predict` route. Kept
// separate from the UI component so the fetch/error-handling logic is easy
// to unit test and reuse, and so components don't need to know about
// FormData / HTTP details.

import { PredictionError, PredictionResult } from "./types";

/** Thrown when the API call fails or the backend returns an error payload. */
export class PredictionRequestError extends Error {}

/**
 * Sends the given image file to our serverless API route, which in turn
 * forwards it to the backend model service. Returns the parsed prediction
 * on success, or throws a PredictionRequestError with a user-friendly
 * message on failure.
 */
export async function identifyFruit(
  file: File
): Promise<PredictionResult> {
  const formData = new FormData();
  // "image" is the field name our /api/predict route (and, in turn, the
  // backend) expects to find the uploaded file under.
  formData.append("image", file);

  let response: Response;
  try {
    response = await fetch("/api/predict", {
      method: "POST",
      body: formData,
    });
  } catch {
    // Typically a network/connectivity failure (user offline, CORS, etc.).
    throw new PredictionRequestError(
      "Could not reach the server. Check your internet connection and try again."
    );
  }

  if (!response.ok) {
    // Try to extract a meaningful error message from the JSON body;
    // fall back to a generic message if the body isn't valid JSON.
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as PredictionError;
      if (body?.error) message = body.error;
    } catch {
      // Ignore JSON parse errors; keep the generic message above.
    }
    throw new PredictionRequestError(message);
  }

  const data = (await response.json()) as PredictionResult;
  return data;
}
