"use client";

// app/page.tsx
//
// This is the only page in the app. It has three jobs:
//   1. Hold the state for what step we're on (idle, loading, success, error)
//   2. Let the user pick a photo (using the ImageUploader component)
//   3. Send that photo off and show the result (using the ResultPanel component)
//
// We just use plain useState hooks here because the page is simple and
// linear - there's no need for anything fancier like Redux or Context.

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ResultPanel from "@/components/ResultPanel";
import { identifyFruit } from "@/lib/api";
import { PredictionResult } from "@/lib/types";

// This type lists every stage the page can be in.
type Status = "idle" | "loading" | "error" | "success";

export default function HomePage() {
  // selectedFile holds the actual photo the user picked (or null if none yet).
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // previewUrl holds a temporary browser URL so we can show the photo on screen.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // status holds which stage we're currently in (see the Status type above).
  const [status, setStatus] = useState<Status>("idle");
  // result holds the prediction we got back once a photo has been identified.
  const [result, setResult] = useState<PredictionResult | null>(null);
  // errorMessage holds a message to show the user if something went wrong.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // This runs when the user picks or drops a new photo.
  function handleFileSelected(file: File, url: string) {
    setSelectedFile(file);
    setPreviewUrl(url);
    // A new photo means we should forget about any old result.
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }

  // This runs when the user clicks the "Identify fruit" button.
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

  // This runs when the user clicks "Reset" - it wipes everything so they
  // can start over with a new photo.
  function handleReset() {
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }

  // The "Identify fruit" button should only be clickable if we have a
  // photo picked and we're not already waiting on a request.
  const canIdentify = selectedFile !== null && status !== "loading";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Fruit Identifier
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-700">
          Upload a photo of an apple or a banana. A trained CNN model will
          identify it and we&apos;ll show you nutrition facts, health
          benefits, ripeness tips, and serving ideas.
        </p>
      </header>

      <section
        className={[
          "grid grid-cols-1 gap-6",
          status === "idle" ? "mx-auto w-full max-w-xl" : "md:grid-cols-2",
        ].join(" ")}
      >
        {/* Left side: the upload box and the two buttons underneath it */}
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
                "flex-1 rounded-xl border-2 px-4 py-3 font-semibold transition-all",
                canIdentify
                  ? "border-ink-900 bg-brand-500 text-white shadow-[3px_3px_0_0_#2a2015] hover:bg-brand-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  : "cursor-not-allowed border-ink-300 bg-cream-200 text-ink-500",
              ].join(" ")}
            >
              {status === "loading" ? "Identifying..." : "Identify fruit"}
            </button>

            {(selectedFile || status !== "idle") && (
              <button
                onClick={handleReset}
                disabled={status === "loading"}
                className="rounded-xl border-2 border-ink-900 bg-cream-50 px-4 py-3 font-medium text-ink-800 shadow-[3px_3px_0_0_#2a2015] hover:bg-cream-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Right side: the result. We only show this once there's actually
            something to show (loading, error, or success) - not when the
            page first loads and nothing has happened yet. */}
        {status !== "idle" && (
          <div className="flex flex-col">
            <ResultPanel
              status={status}
              result={result}
              errorMessage={errorMessage}
            />
          </div>
        )}
      </section>
    </main>
  );
}
