// app/api/predict/route.ts
//
// This is a Next.js Route Handler, i.e. a serverless function that runs on
// Vercel. It acts as a thin proxy between the browser and the real backend
// model service:
//
//   Browser --(multipart/form-data image)--> /api/predict (this file)
//                                               --(forwarded image)--> Backend API
//                                               <--(JSON prediction)----
//   Browser <--(JSON prediction)-----------------
//
// Why proxy instead of calling the backend directly from the browser?
//   1. CORS: the backend doesn't need to be configured to accept
//      cross-origin requests from the frontend's domain.
//   2. Secrecy: BACKEND_API_URL / BACKEND_API_KEY stay server-side only and
//      are never exposed in client-side JavaScript.
//   3. Flexibility: we can swap/retire the backend, add retries, add
//      request logging, or add input validation here without touching the
//      frontend UI code at all.
//
// This route deliberately contains NO model code - the actual CNN
// inference happens in the separate backend service that this project's
// brief describes ("the backend will be calling an api of the model").

import { NextRequest, NextResponse } from "next/server";
import { FruitLabel, PredictionResult } from "@/lib/types";

// Ensure this route always runs dynamically (per-request) rather than being
// statically optimised, since it depends on the incoming request body.
export const dynamic = "force-dynamic";

// Basic client-side-mirrored validation, enforced again here because a
// request could reach this endpoint directly (not just via our own UI).
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  // 1. Parse the incoming multipart form data sent by the browser.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read the uploaded file. Please try again." },
      { status: 400 }
    );
  }

  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file was provided. Please choose a photo to upload." },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a JPEG, PNG, or WEBP image." },
      { status: 415 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please upload a photo under 8 MB." },
      { status: 413 }
    );
  }

  // 2. DEMO MODE: if explicitly enabled, skip the real backend entirely and
  // return a plausible mock prediction. This lets the frontend be built,
  // tested, and demonstrated end-to-end before the model backend exists or
  // while it's temporarily unavailable - handy for the "suitable student
  // environment ... for marking and testing purposes" requirement.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json(buildMockPrediction());
  }

  // 3. Forward the image to the real backend model service.
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.json(
      {
        error:
          "Backend is not configured. Set BACKEND_API_URL in the environment, or enable NEXT_PUBLIC_DEMO_MODE for a demo.",
      },
      { status: 500 }
    );
  }

  const predictPath = process.env.BACKEND_PREDICT_PATH || "/predict";
  const targetUrl = new URL(predictPath, backendUrl).toString();

  // Re-package the file into a fresh FormData to forward downstream.
  const forwardBody = new FormData();
  forwardBody.append("image", file, file.name);

  try {
    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      body: forwardBody,
      headers: process.env.BACKEND_API_KEY
        ? { Authorization: `Bearer ${process.env.BACKEND_API_KEY}` }
        : undefined,
      // Avoid hanging forever if the backend/model API stalls.
      signal: AbortSignal.timeout(20_000),
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: `Backend returned an error (status ${backendResponse.status}).` },
        { status: 502 }
      );
    }

    const backendJson = await backendResponse.json();
    const result = normalizeBackendResponse(backendJson);

    if (!result) {
      return NextResponse.json(
        { error: "Backend returned an unexpected response format." },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      {
        error: isTimeout
          ? "The model backend took too long to respond. Please try again."
          : "Could not reach the model backend. Please try again shortly.",
      },
      { status: 504 }
    );
  }
}

/**
 * The backend is a separate service built/owned by the team, so its exact
 * response shape may vary slightly. This function tolerates a few common
 * shapes (e.g. `{ label, confidence }` or `{ class, probability }`) and
 * normalises them into our canonical PredictionResult type. Adjust this if
 * your backend's contract differs.
 */
function normalizeBackendResponse(json: unknown): PredictionResult | null {
  if (typeof json !== "object" || json === null) return null;
  const obj = json as Record<string, unknown>;

  const rawLabel = (obj.label ?? obj.class ?? obj.prediction) as unknown;
  const rawConfidence = (obj.confidence ?? obj.probability ?? obj.score) as unknown;

  const label = normalizeLabel(rawLabel);
  const confidence =
    typeof rawConfidence === "number" ? clamp01(rawConfidence) : 0;

  if (!label) return null;
  return { label, confidence };
}

function normalizeLabel(value: unknown): FruitLabel | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase().trim();
  if (lower === "apple" || lower === "banana") return lower;
  if (lower === "unknown") return "unknown";
  return null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Produces a random-but-plausible mock prediction for demo mode. */
function buildMockPrediction(): PredictionResult {
  const label: FruitLabel = Math.random() > 0.5 ? "apple" : "banana";
  const confidence = 0.75 + Math.random() * 0.24; // ~0.75-0.99
  return { label, confidence: Math.round(confidence * 1000) / 1000 };
}
