"use client";

// Everything for the fruit identifier page lives in this one file - the
// upload box, the result display, the fruit info, and the page itself.
// It used to be split across lib/ and components/ but we put it all here
// so it's easier to follow top to bottom.

import { ChangeEvent, useRef, useState } from "react";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

type FruitLabel = "apple" | "banana" | "unknown";
type Step = "idle" | "loading" | "error" | "success";

interface PredictionResult {
  label: FruitLabel;
  confidence: number;
}

interface PredictionError {
  error: string;
}

interface FruitInfo {
  displayName: string;
  emoji: string;
  summary: string;
  nutrition: { label: string; value: string }[];
  healthBenefits: string[];
  ripenessTips: string[];
  usageIdeas: string[];
}

// ---------------------------------------------------------------------
// Fruit data - nutrition/health/ripeness/usage text for each fruit we support
// ---------------------------------------------------------------------

const FRUIT_INFO: { apple: FruitInfo; banana: FruitInfo } = {
  apple: {
    displayName: "Apple",
    emoji: "🍎",
    summary:
      "A crisp, versatile fruit that's one of the most widely eaten fruits in the world, available in many varieties and colours.",
    nutrition: [
      { label: "Calories", value: "~95 kcal per medium apple (182g)" },
      { label: "Carbohydrates", value: "~25 g" },
      { label: "Dietary fibre", value: "~4 g" },
      { label: "Sugars", value: "~19 g (natural)" },
      { label: "Vitamin C", value: "~14% of daily value" },
      { label: "Potassium", value: "~195 mg" },
    ],
    healthBenefits: [
      "High in soluble fibre (pectin), which supports healthy digestion and steady blood sugar levels.",
      "Rich in polyphenol antioxidants, particularly in the skin, which help fight oxidative stress.",
      "Associated with improved heart health, including healthier cholesterol levels.",
      "Low in calories and filling, making it a good snack for weight management.",
    ],
    ripenessTips: [
      "Look for firm, smooth skin without soft spots, bruising, or wrinkling.",
      "Colour should be vivid and consistent for the variety (e.g. deep red, bright green, or yellow).",
      "A ripe apple feels heavy for its size and smells faintly sweet near the stem.",
      "Avoid apples with a mealy or hollow sound when tapped - this can indicate overripeness.",
    ],
    usageIdeas: [
      "Eaten raw as a snack, sliced with peanut butter or cheese.",
      "Baked into apple pie, crumble, or cinnamon-spiced desserts.",
      "Blended into smoothies for natural sweetness and fibre.",
      "Grated or diced into salads, oatmeal, or savoury dishes like roast pork.",
      "Pressed into juice or simmered down into apple sauce.",
    ],
  },
  banana: {
    displayName: "Banana",
    emoji: "🍌",
    summary:
      "A soft, energy-dense fruit with a distinctive peel, popular as a quick snack and a staple ingredient in baking and smoothies.",
    nutrition: [
      { label: "Calories", value: "~105 kcal per medium banana (118g)" },
      { label: "Carbohydrates", value: "~27 g" },
      { label: "Dietary fibre", value: "~3 g" },
      { label: "Sugars", value: "~14 g (natural)" },
      { label: "Potassium", value: "~422 mg" },
      { label: "Vitamin B6", value: "~22% of daily value" },
    ],
    healthBenefits: [
      "Excellent source of potassium, supporting healthy blood pressure and muscle function.",
      "Provides quick, easily digestible energy, making it a popular pre/post-exercise snack.",
      "Contains resistant starch (especially when slightly underripe) that supports gut health.",
      "Good source of vitamin B6, which supports metabolism and brain function.",
    ],
    ripenessTips: [
      "Bright yellow skin with little to no green indicates ready-to-eat ripeness.",
      "Small brown speckles are normal and often signal peak sweetness.",
      "A banana that is still green/firm will ripen further at room temperature over a few days.",
      "Heavily bruised or very soft, dark skin indicates overripeness - best used for baking rather than eating raw.",
    ],
    usageIdeas: [
      "Eaten on its own as a quick, portable snack.",
      "Blended into smoothies or shakes for creaminess and natural sweetness.",
      "Mashed into banana bread, pancakes, or muffins (great use for overripe bananas).",
      "Sliced over cereal, oatmeal, or yoghurt.",
      "Frozen and blended for a dairy-free 'nice cream' dessert.",
    ],
  },
};

// Looks up the info for a label. Returns undefined for "unknown" so the UI
// can show a fallback message instead of crashing.
function getFruitInfo(label: FruitLabel): FruitInfo | undefined {
  if (label === "apple") return FRUIT_INFO.apple;
  if (label === "banana") return FRUIT_INFO.banana;
  return undefined;
}

// ---------------------------------------------------------------------
// API call - sends the photo to our own /api/predict route
// ---------------------------------------------------------------------

async function identifyFruit(file: File): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append("image", file);

  let res: Response;
  try {
    res = await fetch("/api/predict", {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "Could not reach the server. Check your internet connection and try again."
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as PredictionError | null;
    throw new Error(body?.error ?? `Request failed with status ${res.status}.`);
  }

  return (await res.json()) as PredictionResult;
}

// ---------------------------------------------------------------------
// Small pieces of UI
// ---------------------------------------------------------------------

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  let barColor = "bg-red-500";
  if (percent >= 80) barColor = "bg-green-500";
  else if (percent >= 50) barColor = "bg-yellow-500";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Model confidence</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-4 border-b border-gray-200 pb-4"}>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}

function FruitInfoCard({ info }: { info: FruitInfo }) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-4xl">{info.emoji}</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{info.displayName}</h2>
          <p className="text-sm text-gray-500">{info.summary}</p>
        </div>
      </div>

      <Section title="Nutrition (approx. per serving)">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {info.nutrition.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            >
              <dt className="text-gray-500">{item.label}</dt>
              <dd className="font-medium text-gray-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Health benefits">
        <BulletList items={info.healthBenefits} />
      </Section>

      <Section title="How to tell it's ripe">
        <BulletList items={info.ripenessTips} />
      </Section>

      <Section title="Ways to enjoy it" last>
        <BulletList items={info.usageIdeas} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------
// The upload box
// ---------------------------------------------------------------------

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB, same limit the server checks

function ImageUploader({
  onPick,
  disabled,
  preview,
}: {
  onPick: (file: File, preview: string) => void;
  disabled?: boolean;
  preview: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function checkAndPick(file: File | undefined | null) {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("That image is too large - please pick one under 8 MB.");
      return;
    }

    setError(null);
    setFileName(file.name);
    onPick(file, URL.createObjectURL(file));
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    checkAndPick(e.target.files?.[0]);
    // clear it so picking the same file twice still fires a change event
    e.target.value = "";
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Choose photo
        </button>
        <span className="text-sm text-gray-500">
          {fileName ?? "No file chosen - JPEG, PNG, or WEBP, up to 8 MB"}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Selected fruit preview"
          className="mt-3 h-32 w-32 rounded border border-gray-200 object-cover"
        />
      )}

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// The result side - loading / error / success states
// ---------------------------------------------------------------------

const CONFIDENCE_THRESHOLD = 0.5;

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
    <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center">
      <span className={`text-4xl ${spinner ? "animate-pulse" : ""}`}>{emoji}</span>
      <p className="font-medium text-gray-800">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}

function ResultPanel({
  step,
  prediction,
  error,
}: {
  step: "loading" | "error" | "success";
  prediction: PredictionResult | null;
  error: string | null;
}) {
  if (step === "loading") {
    return (
      <EmptyState
        emoji="⏳"
        title="Analysing your photo..."
        description="Sending the image to the model backend. This usually takes a few seconds."
        spinner
      />
    );
  }

  if (step === "error") {
    return (
      <div className="w-full rounded-lg border border-red-300 bg-red-50 p-6 text-center">
        <p className="mb-1 text-2xl">⚠️</p>
        <p className="font-medium text-red-700">Something went wrong</p>
        <p className="mt-1 text-sm text-gray-700">{error ?? "Please try again."}</p>
      </div>
    );
  }

  // step is "success" from here on
  if (!prediction) return null;

  const isConfident =
    prediction.label !== "unknown" && prediction.confidence >= CONFIDENCE_THRESHOLD;
  const info = isConfident ? getFruitInfo(prediction.label) : undefined;

  if (!info) {
    return (
      <div className="w-full rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-center">
        <p className="mb-1 text-2xl">🤔</p>
        <p className="font-medium text-gray-800">
          Couldn&apos;t confidently identify an apple or banana
        </p>
        <p className="mt-1 text-sm text-gray-700">
          Try a clearer, well-lit photo with the fruit centred and filling most of the frame.
        </p>
        {prediction.label !== "unknown" && (
          <div className="mx-auto mt-4 max-w-xs">
            <ConfidenceBar confidence={prediction.confidence} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-gray-200 bg-green-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-green-700">
          Identified as {info.displayName} {info.emoji}
        </p>
        <div className="mt-3">
          <ConfidenceBar confidence={prediction.confidence} />
        </div>
      </div>
      <FruitInfoCard info={info} />
    </div>
  );
}

// ---------------------------------------------------------------------
// The page itself
// ---------------------------------------------------------------------

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(newFile: File, newPreview: string) {
    setFile(newFile);
    setPreview(newPreview);
    setStep("idle");
    setPrediction(null);
    setError(null);
  }

  async function onSubmit() {
    if (!file) return;

    setStep("loading");
    setError(null);

    try {
      const res = await identifyFruit(file);
      setPrediction(res);
      setStep("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error while identifying the fruit."
      );
      setStep("error");
    }
  }

  function onReset() {
    setFile(null);
    setPreview(null);
    setStep("idle");
    setPrediction(null);
    setError(null);
  }

  const canSubmit = file !== null && step !== "loading";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10 sm:py-14">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          BoBoiBoy&apos;s Fruit Identifier
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Upload a photo of an apple or a banana. A trained CNN model will identify it and
          we&apos;ll show you nutrition facts, health benefits, ripeness tips, and serving ideas.
        </p>
      </header>

      <section
        className={`grid grid-cols-1 gap-6 ${
          step === "idle" ? "mx-auto w-full max-w-xl" : "md:grid-cols-2"
        }`}
      >
        <div className="flex flex-col gap-4">
          <ImageUploader onPick={onPick} preview={preview} disabled={step === "loading"} />

          <div className="flex gap-3">
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`flex-1 rounded-md px-4 py-2 font-medium transition-colors ${
                canSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {step === "loading" ? "Identifying..." : "Identify fruit"}
            </button>

            {(file || step !== "idle") && (
              <button
                onClick={onReset}
                disabled={step === "loading"}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {step !== "idle" && (
          <div className="flex flex-col">
            <ResultPanel step={step} prediction={prediction} error={error} />
          </div>
        )}
      </section>
    </main>
  );
}
