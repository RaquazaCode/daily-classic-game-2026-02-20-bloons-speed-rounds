import type { BalloonTier, DifficultyChoice } from "../types";

export interface BalloonDefinition {
  tier: BalloonTier;
  color: string;
  health: number;
  speedMultiplier: number;
  reward: number;
  resistantToIce: boolean;
}

export const BALLOON_DEFINITIONS: Record<BalloonTier, BalloonDefinition> = {
  red: {
    tier: "red",
    color: "#f86b93",
    health: 1,
    speedMultiplier: 1,
    reward: 6,
    resistantToIce: false,
  },
  blue: {
    tier: "blue",
    color: "#69d1ff",
    health: 2,
    speedMultiplier: 1.08,
    reward: 8,
    resistantToIce: false,
  },
  green: {
    tier: "green",
    color: "#8df38a",
    health: 3,
    speedMultiplier: 1.14,
    reward: 11,
    resistantToIce: false,
  },
  black: {
    tier: "black",
    color: "#3e4654",
    health: 4,
    speedMultiplier: 1.2,
    reward: 15,
    resistantToIce: true,
  },
};

const PRESET_WAVES: Record<DifficultyChoice, BalloonTier[][]> = {
  easy: [
    ["red", "red", "red", "red", "red", "blue", "red", "red"],
    ["red", "blue", "red", "blue", "red", "blue", "green", "red", "red"],
    ["red", "blue", "blue", "green", "blue", "green", "red", "blue", "red", "green"],
    ["blue", "blue", "green", "green", "blue", "green", "blue", "green", "black"],
  ],
  medium: [
    ["red", "red", "blue", "red", "blue", "red", "green", "blue", "red"],
    ["red", "blue", "green", "blue", "green", "red", "green", "blue", "black", "red"],
    ["blue", "green", "green", "blue", "black", "green", "blue", "green", "black", "blue"],
    ["green", "green", "black", "green", "black", "green", "blue", "black", "green", "black", "blue"],
  ],
  hard: [
    ["red", "blue", "blue", "green", "blue", "green", "blue", "green", "black"],
    ["blue", "green", "green", "black", "green", "black", "green", "blue", "black", "green"],
    ["green", "black", "green", "black", "green", "black", "blue", "black", "green", "black", "green"],
    ["black", "green", "black", "green", "black", "green", "black", "green", "black", "green", "black"],
  ],
};

export function getPresetWave(difficulty: DifficultyChoice, wave: number): BalloonTier[] | null {
  const index = wave - 1;
  const preset = PRESET_WAVES[difficulty][index];
  if (!preset) {
    return null;
  }
  return [...preset];
}
