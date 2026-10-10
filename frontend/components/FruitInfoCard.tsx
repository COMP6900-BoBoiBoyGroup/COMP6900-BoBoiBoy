// components/FruitInfoCard.tsx
//
// This component shows all the info about an identified fruit: nutrition
// facts, health benefits, ripeness tips, and usage ideas. It just takes
// a FruitInfo object (see lib/fruitInfo.ts) and lays it out - it doesn't
// fetch or look up anything itself.

import { FruitInfo } from "@/lib/types";

interface FruitInfoCardProps {
  info: FruitInfo;
}

export default function FruitInfoCard({ info }: FruitInfoCardProps) {
  return (
    <div className="w-full rounded-2xl border-2 border-ink-900 bg-cream-50 p-6 shadow-[4px_4px_0_0_#2a2015]">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {info.emoji}
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            {info.displayName}
          </h2>
          <p className="text-sm text-ink-500">{info.summary}</p>
        </div>
      </div>

      <Section title="Nutrition (approx. per serving)">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {info.nutrition.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-ink-200 bg-cream-100 px-3 py-2 text-sm"
            >
              <dt className="text-ink-500">{item.label}</dt>
              <dd className="font-medium text-ink-800">{item.value}</dd>
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

// Small helper used for each block below (Nutrition, Health benefits,
// etc.) - just a title plus whatever's inside, with a line underneath
// unless it's the last section.
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
    <div className={last ? "" : "mb-5 border-b border-ink-200 pb-5"}>
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-brand-700">
        {title}
      </h3>
      {children}
    </div>
  );
}

// Small helper that turns a list of strings into a bullet-point list.
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-ink-700">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );
}
