import type { ModelType, QuickStartCard } from "../types";

export const MODEL_OPTIONS: Array<{
  id: ModelType;
  label: string;
  icon: string;
}> = [
  { id: "image", label: "Image", icon: "image" },
  { id: "sprite", label: "Sprite", icon: "sprite" },
  { id: "3d-object", label: "3D Object", icon: "cube" },
  { id: "video", label: "Video", icon: "video" },
  { id: "character", label: "Character", icon: "character" },
];

export const SUGGESTION_CHIPS = [
  "Cube",
  "Sword",
  "Character",
  "Environment",
  "Pixel Art",
] as const;

export const QUICK_START_CARDS: QuickStartCard[] = [
  {
    id: "qs-3d",
    titleLine1: "Help me to create",
    titleLine2: "3D object",
    model: "3d-object",
    prompt: "Create a stylized 3D model of a floating game cube with soft lighting",
    gradientClass: "aw-card-gradient-1",
    previewKind: "cube",
  },
  {
    id: "qs-sprite",
    titleLine1: "Help me to create",
    titleLine2: "game sprite",
    model: "sprite",
    prompt: "Create a pixel art knight character sprite for a 2D RPG",
    gradientClass: "aw-card-gradient-2",
    previewKind: "sprite",
  },
  {
    id: "qs-env",
    titleLine1: "Help me to create",
    titleLine2: "environment",
    model: "image",
    prompt: "Create a cinematic game environment with fog and soft ambient light",
    gradientClass: "aw-card-gradient-3",
    previewKind: "environment",
  },
];

export const MOCK_GENERATE_MS = 1800;
export const CREDITS_TOTAL = 10;

export function modelLabel(model: ModelType): string {
  return MODEL_OPTIONS.find((item) => item.id === model)?.label ?? "Image";
}

export function projectNameFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/^create\s+(a|an)\s+/i, "").trim();
  if (!cleaned) return "Untitled project";
  const words = cleaned.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 28 ? `${words.slice(0, 28)}…` : words;
}

export function assetTone(model: ModelType, variant: number): string {
  const tones: Record<ModelType, string[]> = {
    image: [
      "linear-gradient(145deg, #2a3558 0%, #5b4b8a 48%, #1c2438 100%)",
      "linear-gradient(145deg, #1f3b4d 0%, #3d6b8a 50%, #1a2233 100%)",
    ],
    sprite: [
      "linear-gradient(145deg, #243447 0%, #4a7c9b 45%, #d48aa8 100%)",
      "linear-gradient(145deg, #2b2f4a 0%, #6a8fd6 50%, #f0b4c8 100%)",
    ],
    "3d-object": [
      "linear-gradient(145deg, #2d2758 0%, #4f6fd6 50%, #1b2033 100%)",
      "linear-gradient(145deg, #352868 0%, #38bdf8 55%, #1a1f30 100%)",
    ],
    video: [
      "linear-gradient(145deg, #241f3a 0%, #6d5dfb 45%, #22d3ee 100%)",
      "linear-gradient(145deg, #1e2438 0%, #8b5cf6 50%, #0f172a 100%)",
    ],
    character: [
      "linear-gradient(145deg, #3a2750 0%, #ec4899 40%, #f59e0b 100%)",
      "linear-gradient(145deg, #2a3048 0%, #a78bfa 48%, #f472b6 100%)",
    ],
  };
  const list = tones[model];
  return list[variant % list.length] ?? list[0];
}
