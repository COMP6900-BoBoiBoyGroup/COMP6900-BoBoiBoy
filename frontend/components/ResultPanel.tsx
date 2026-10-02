// components/ResultPanel.tsx
//
// Decides what to render for a given app "state": loading, error, an
// unrecognised/low-confidence result, or a successful identification (in
// which case it renders the fruit's name/confidence plus the full
// FruitInfoCard). Centralising this branching logic here keeps
// app/page.tsx focused on orchestration rather than presentation.

import { PredictionResult } from "@/lib/types";
import { getFruitInfo } from "@/lib/fruitInfo";
import ConfidenceBar from "./ConfidenceBar";
import FruitInfoCard from "./FruitInfoCard";

// Below this confidence threshold we treat a result as "not confident
// enough" even if the backend technically returned apple/banana, since a
// low-confidence guess could easily be wrong and might mislead the user.
const CONFIDENCE_THRESHOLD = 0.5;

interface ResultPanelProps {
  status: "idle" | "loading" | "error" | "success";
  result: PredictionResult | null;
  errorMessage: string | null;
}

export default function ResultPanel({
  status,
  result,
  errorMessage,
}: ResultPanelProps) {
  if (status === "idle") {
    return (
      <EmptyState
        emoji="🔍"
        title="No photo analysed yet"
        description="Upload a photo of an apple or banana and press “Identify fruit” to see the result here."
      />
    );
  }

  if (status === "loading") {
    return (
      <EmptyState
        emoji="⏳"
        title="Analysing your photo..."
        description="Sending the image to the model backend. This usually takes a few seconds."
        spinner
      />
    );
  }

  if (status === "error") {
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="mb-1 text-2xl">⚠️</p>
        <p className="font-medium text-red-700">Something went wrong</p>
        <p className="mt-1 text-sm text-red-600">
          {errorMessage ?? "Please try again."}
        </p>
      </div>
    );
  }

  // status === "success" from here on.
  if (!result) return null;

  const isConfident =
    result.label !== "unknown" && result.confidence >= CONFIDENCE_THRESHOLD;
  const info = isConfident ? getFruitInfo(result.label) : undefined;

  if (!info) {
    return (
      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="mb-1 text-2xl">🤔</p>
        <p className="font-medium text-amber-800">
          Couldn&apos;t confidently identify an apple or banana
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Try a clearer, well-lit photo with the fruit centred and filling
          most of the frame.
        </p>
        {result.label !== "unknown" && (
          <div className="mx-auto mt-4 max-w-xs">
            <ConfidenceBar confidence={result.confidence} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-sm font-medium text-brand-700">
          Identified as {info.displayName} {info.emoji}
        </p>
        <div className="mt-3">
          <ConfidenceBar confidence={result.confidence} />
        </div>
      </div>
      <FruitInfoCard info={info} />
    </div>
  );
}

function EmptyState({
  emoji,
  title,
  description,
  spinner,
}: {
  emoji: string;
  title: string;
  description: string;
  spinner?: boolean;
}) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <span className={`text-4xl ${spinner ? "animate-pulse" : ""}`} aria-hidden>
        {emoji}
      </span>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
