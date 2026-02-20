import { getPresetWave } from "../data/waves";
import type { BalloonTier, DifficultyChoice } from "../types";

const TIER_ORDER: BalloonTier[] = ["red", "blue", "green", "black"];

function clampTierIndex(index: number): number {
  return Math.max(0, Math.min(TIER_ORDER.length - 1, index));
}

export function buildWavePlan(wave: number, difficulty: DifficultyChoice, rng: () => number): BalloonTier[] {
  const preset = getPresetWave(difficulty, wave);
  if (preset) {
    return preset;
  }

  const baseCount = 8 + wave * 2;
  const difficultyScale = difficulty === "easy" ? 0.9 : difficulty === "hard" ? 1.2 : 1;
  const count = Math.max(8, Math.round(baseCount * difficultyScale));
  const plan: BalloonTier[] = [];

  const difficultyOffset = difficulty === "easy" ? -1 : difficulty === "hard" ? 1 : 0;
  const baseTierIndex = clampTierIndex(Math.floor(wave / 3) + difficultyOffset);

  for (let index = 0; index < count; index += 1) {
    const variance = rng() < 0.65 ? 0 : rng() < 0.9 ? 1 : -1;
    const tierIndex = clampTierIndex(baseTierIndex + variance);
    plan.push(TIER_ORDER[tierIndex]);
  }

  return plan;
}

export function getWaveCompletionBonus(wave: number, difficulty: DifficultyChoice): number {
  const base = 20 + wave * 6;
  const difficultyMultiplier = difficulty === "easy" ? 1 : difficulty === "medium" ? 1.1 : 1.2;
  return Math.round(base * difficultyMultiplier);
}
