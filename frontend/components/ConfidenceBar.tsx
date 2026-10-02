// components/ConfidenceBar.tsx
//
// Small presentational component that renders the model's confidence score
// (0-1) as a horizontal progress bar plus a percentage label. Kept generic
// (no fruit-specific logic) so it's easy to reuse if more classes are added
// later as a stretch goal.

interface ConfidenceBarProps {
  confidence: number; // 0..1
}

export default function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percent = Math.round(confidence * 100);

  const barColor =
    percent >= 80
      ? "bg-brand-500"
      : percent >= 50
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>Model confidence</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
