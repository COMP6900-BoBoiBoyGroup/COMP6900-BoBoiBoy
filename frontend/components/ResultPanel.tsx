// components/ResultPanel.tsx
//
// This component looks at the current status (loading, error, or
// success) and decides what to show on the right side of the page: a
// loading message, an error message, a "couldn't tell" message, or the
// full result with the fruit's info card.

import { PredictionResult } from "@/lib/types";
import { getFruitInfo } from "@/lib/fruitInfo";
import ConfidenceBar from "./ConfidenceBar";
import FruitInfoCard from "./FruitInfoCard";
import Image from "next/image";

// If the model's confidence is below this number, we treat the result as
// "not sure enough" even if it technically guessed apple or banana - a
// low-confidence guess could easily be wrong, so we don't want to mislead
// the user.
const CONFIDENCE_THRESHOLD = 0.5;

interface ResultPanelProps {
  // app/page.tsx only renders this component once status isn't "idle"
  // anymore, so this component only needs to handle these three states.
  status: "loading" | "error" | "success";
  result: PredictionResult | null;
  errorMessage: string | null;
}

export default function ResultPanel({
  status,
  result,
  errorMessage,
}: ResultPanelProps) {
  if (status === "loading") {
    return (
      <EmptyState
        title="Analysing your photo..."
        description="Sending the image to the model backend. This usually takes a few seconds."
      />
    );
  }

  if (status === "error") {
      return (
        <div className="w-full border-2 border-apple-500 bg-white p-6 text-center">
          <Image
            src="/icons/exclamation.svg"
            alt=""
            width={24}
            height={24}
            className="mx-auto mb-1 block"
            aria-hidden="true"
          />
          <p className="font-medium text-apple-600">Something went wrong</p>
          <p className="mt-1 text-sm text-ink-700">
            {errorMessage ?? "Please try again."}
          </p>
        </div>
      );
  }

  // From here on, status is "success".
  if (!result) return null;

  // We only trust the result if the label isn't "unknown" and the
  // confidence is high enough.
  const isConfident =
    result.label !== "unknown" && result.confidence >= CONFIDENCE_THRESHOLD;
  const info = isConfident ? getFruitInfo(result.label) : undefined;

  if (!info) {
    return (
      <div className="w-full border-2 border-banana-500 bg-banana-50 p-6 text-center">
        <p className="mb-1 text-2xl">🤔</p>
        <p className="font-medium text-ink-800">
          Couldn&apos;t confidently identify an apple or banana
        </p>
        <p className="mt-1 text-sm text-ink-700">
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
      <div className="border-2 border-ink-900 bg-white p-4 shadow-[3px_3px_0_0_#2a2015]">
        <p className="font-display text-sm font-semibold text-brand-700">
          <span className="inline-flex items-center gap-1">
            Identified as {info.displayName}
            <Image
              src={result.label === "apple" ? "/icons/apple.svg" : "/icons/banana.svg"}
              alt=""
              width={14}
              height={14}
              className="h-[14px] w-[14px] shrink-0 object-contain"
            />
          </span>
        </p>
        <div className="mt-3">
          <ConfidenceBar confidence={result.confidence} />
        </div>
      </div>
      <FruitInfoCard info={info} />
    </div>
  );
}

// This is a small helper used for the loading/empty states above - just
// an emoji, a title, and a short description, centred in a box.
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-300 bg-cream-50 p-6 text-center">
    <Image
      src="/icons/time.svg"
      alt=""
      width={36}
      height={36}
      className="animate-[spin_3s_linear_infinite]"
      aria-hidden="true"
    />
      <p className="font-display font-medium text-ink-800">{title}</p>
      <p className="max-w-sm text-sm text-ink-500">{description}</p>
    </div>
  );
}
