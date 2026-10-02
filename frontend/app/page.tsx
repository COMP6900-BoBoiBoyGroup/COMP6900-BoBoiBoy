"use client";

// app/page.tsx
//
// Main (and only) page of the app. It keeps track of what step the user is
// on (idle -> loading -> success/error) and connects the three main parts
// of the UI together:
//   1. ImageUploader   - lets the user choose a photo (brief requirement 3)
//   2. The "Identify fruit" button - sends the photo to lib/api.ts, which
//      calls our /api/predict route
//   3. ResultPanel     - shows the identified fruit + nutrition/health/
//      ripeness/usage info (brief requirement 4)
//
// State is kept with plain useState hooks since this is a single page with
// a simple, linear flow - there's no need for a global state library here.

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultPanel from "@/components/ResultPanel";
import { identifyFruit } from "@/lib/api";
import { PredictionResult } from "@/lib/types";

// The possible stages the page can be in.
type Status = "idle" | "loading" | "error" | "success";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Called by ImageUploader when the user picks a new photo.
  function handleFileSelected(file: File, url: string) {
    setSelectedFile(file);
    setPreviewUrl(url);
    // Picking a new photo clears any previous result.
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }

  // Called when the user clicks "Identify fruit".
  async function handleIdentify() {
    if (!selectedFile) return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const prediction = await identifyFruit(selectedFile);
      setResult(prediction);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error while identifying the fruit. Please try again.";
      setErrorMessage(message);
      setStatus("error");
    }
  }

  // Clears everything so the user can start over with a new photo.
  function handleReset() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }

  const canIdentify = selectedFile !== null && status !== "loading";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          🍎 Rindr 🍌
        </h1>
        <p className="mt-2 text-slate-600">
          Upload a photo of an apple or a banana. A trained CNN model will
          identify it and we&apos;ll show you nutrition facts, health
          benefits, ripeness tips, and serving ideas.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column: upload + controls */}
        <div className="flex flex-col gap-4">
          <ImageUploader
            onFileSelected={handleFileSelected}
            previewUrl={previewUrl}
            disabled={status === "loading"}
          />

          <div className="flex gap-3">
            <button
              onClick={handleIdentify}
              disabled={!canIdentify}
              className={[
                "flex-1 rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition-colors",
                canIdentify
                  ? "bg-brand-500 hover:bg-brand-600"
                  : "cursor-not-allowed bg-slate-300",
              ].join(" ")}
            >
              {status === "loading" ? "Identifying..." : "Identify fruit"}
            </button>

            {(selectedFile || status !== "idle") && (
              <button
                onClick={handleReset}
                disabled={status === "loading"}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right column: result / fruit info */}
        <div className="flex flex-col">
          <ResultPanel
            status={status}
            result={result}
            errorMessage={errorMessage}
          />
        </div>
      </section>

      <footer className="mt-auto pt-6 text-center text-xs text-slate-400">
        Frontend only - image classification is performed by a separate
        backend model service. Project 4: CNN Fruit Identification.
      </footer>
    </main>
  );
}
