// app/api/predict/route.ts
//
// This file is a Next.js "Route Handler" - basically a small server
// function that runs on Vercel. It sits in between the browser and the
// real backend, like this:
//
//   Browser --(photo)--> this route --(photo)--> Backend (runs the model)
//   Browser <--(result)-- this route <--(result)-- Backend
//
// We go through our own route instead of calling the backend directly
// from the browser for two reasons:
//   1. It avoids CORS problems, since the backend doesn't need to be set
//      up to accept requests coming from our frontend's domain.
//   2. It keeps the backend's URL hidden from the browser instead of
//      exposing it to anyone who opens the dev tools.
//
// This file does NOT contain any CNN/model code - that all lives in the
// separate backend service.

import { NextRequest, NextResponse } from "next/server";
import { FruitLabel, PredictionResult } from "@/lib/types";

// This tells Next.js to never cache this route - every request has a
// different uploaded photo, so caching wouldn't make sense here.
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  // Step 1: read the uploaded file out of the request. This throws if the
  // request wasn't actually sent as multipart/form-data (e.g. no file was
  // attached), so we catch that and return a normal error response
  // instead of letting it crash.
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

  // Step 2: demo mode. If this is turned on, we skip the real backend
  // completely and just send back a random fake result. This is handy
  // for trying out the frontend before the backend is ready or deployed.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return NextResponse.json(getMockPrediction());
  }

  // Step 3: otherwise, send the photo on to the real backend.
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

  // Build a new FormData to forward the file on to the backend.
  const forwardData = new FormData();
  forwardData.append("image", file, file.name);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl + predictPath, {
      method: "POST",
      body: forwardData,
    });
  } catch {
    // This happens if the backend is down or unreachable.
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

  // Step 4: the backend should send back JSON like
  // { "label": "apple", "confidence": 0.94 }. We double check it actually
  // looks like that before trusting it and passing it on to the browser.
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

// This just makes up a random apple/banana result with a believable
// confidence score. It's only ever used when NEXT_PUBLIC_DEMO_MODE is on.
function getMockPrediction(): PredictionResult {
  const label: FruitLabel = Math.random() > 0.5 ? "apple" : "banana";
  const confidence = Math.round((0.75 + Math.random() * 0.24) * 1000) / 1000;
  return { label, confidence };
}
