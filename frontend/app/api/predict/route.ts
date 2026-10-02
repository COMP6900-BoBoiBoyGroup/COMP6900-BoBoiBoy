// app/api/predict/route.ts
//
// This is a Next.js "Route Handler" - a small server-side function that
// runs on Vercel. It sits between the browser and the real backend:
//
//   Browser --(photo)--> this route --(photo)--> Backend API (runs the CNN model)
//   Browser <--(result)-- this route <--(result)-- Backend API
//
// Why go through our own route instead of calling the backend directly
// from the browser?
//   1. CORS: the backend doesn't need extra configuration to accept
//      requests from our frontend's domain.
//   2. Secrecy: the backend's URL/key stay on the server and are never
//      sent to the user's browser.
//
// This route does NOT contain any CNN/model code - that lives in the
// separate backend service that the project brief describes.

import { NextRequest, NextResponse } from "next/server";
import { FruitLabel, PredictionResult } from "@/lib/types";

// Make sure this route always runs fresh for every request (it depends on
// the uploaded file in the request body, so it can't be cached).
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  // 1. Read the uploaded file out of the request. This throws if the
  // request wasn't sent as multipart/form-data (e.g. no file attached at
  // all), so we catch that and return a friendly error instead of a crash.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No image file was provided. Please choose a photo to upload." },
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

  // 2. DEMO MODE: while the backend/model isn't ready yet, we can return a
  // random mock result instead of calling it. This lets us build and show
  // the frontend before the rest of the team is finished.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json(getMockPrediction());
  }

  // 3. Otherwise, forward the image to the real backend.
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.json(
      {
        error:
          "Backend is not configured. Set BACKEND_API_URL, or turn on NEXT_PUBLIC_DEMO_MODE to test without one.",
      },
      { status: 500 }
    );
  }

  const predictPath = process.env.BACKEND_PREDICT_PATH || "/predict";

  // Put the file into a new FormData to send on to the backend.
  const forwardData = new FormData();
  forwardData.append("image", file, file.name);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl + predictPath, {
      method: "POST",
      body: forwardData,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the model backend. Please try again shortly." },
      { status: 502 }
    );
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { error: `Backend returned an error (status ${backendResponse.status}).` },
      { status: 502 }
    );
  }

  // 4. The backend should reply with JSON like { "label": "apple", "confidence": 0.94 }.
  const backendJson = await backendResponse.json();
  const label = backendJson.label as FruitLabel | undefined;
  const confidence = backendJson.confidence as number | undefined;

  const isValidLabel = label === "apple" || label === "banana" || label === "unknown";
  if (!isValidLabel || typeof confidence !== "number") {
    return NextResponse.json(
      { error: "Backend returned an unexpected response format." },
      { status: 502 }
    );
  }

  const result: PredictionResult = { label, confidence };
  return NextResponse.json(result);
}

// Returns a random apple/banana result with a plausible confidence score,
// used only when NEXT_PUBLIC_DEMO_MODE is turned on.
function getMockPrediction(): PredictionResult {
  const label: FruitLabel = Math.random() > 0.5 ? "apple" : "banana";
  const confidence = Math.round((0.75 + Math.random() * 0.24) * 1000) / 1000;
  return { label, confidence };
}
