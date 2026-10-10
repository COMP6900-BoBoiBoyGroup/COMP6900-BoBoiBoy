// lib/fruitInfo.ts
//
// This file just holds the nutrition/health/ripeness/usage text for each
// fruit, written out by hand as a plain object. We don't fetch this from
// anywhere - the model only tells us "apple" or "banana", and we look up
// the matching info here. This content barely ever changes, so there's no
// need for a database or an API call just to show it.
//
// To add another fruit later, add a new entry below and also add the
// label to the FruitLabel type in lib/types.ts.

import { FruitInfo, FruitLabel } from "./types";

// This holds one entry per fruit we support, keyed by its label.
export const FRUIT_INFO: { apple: FruitInfo; banana: FruitInfo } = {
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

// This looks up the info for a given label. It returns undefined for
// "unknown" (or anything else unexpected), so the UI can show a friendly
// fallback message instead of breaking.
export function getFruitInfo(label: FruitLabel): FruitInfo | undefined {
  if (label === "apple") return FRUIT_INFO.apple;
  if (label === "banana") return FRUIT_INFO.banana;
  return undefined;
}
