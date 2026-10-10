// components/ConfidenceBar.tsx
//
// This component just draws a progress bar showing how confident the
// model is, plus the percentage as text. It doesn't know anything about
// apples or bananas specifically, so it could be reused for any score.

interface ConfidenceBarProps {
  confidence: number; // a number from 0 to 1
}

export default function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  // Turn the 0-1 confidence number into a whole percentage, e.g. 0.834 -> 83.
  const percent = Math.round(confidence * 100);

  // Pick the bar colour based on how confident the result is: green for
  // high, yellow for medium, red for low.
  const barColor =
    percent >= 80
      ? "bg-brand-500"
      : percent >= 50
      ? "bg-banana-500"
      : "bg-apple-500";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-ink-500">
        <span>Model confidence</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-ink-200 bg-cream-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
