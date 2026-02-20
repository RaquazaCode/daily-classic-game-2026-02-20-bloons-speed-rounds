import type { DifficultyChoice, Vec2 } from "../types";

export interface MapDefinition {
  id: string;
  name: string;
  difficulty: DifficultyChoice;
  summary: string;
  pathPoints: Vec2[];
  spawnModifiers: {
    intervalMultiplier: number;
    speedMultiplier: number;
    waveSizeMultiplier: number;
  };
  rewardMultiplier: number;
}

export const MAP_DEFINITIONS: MapDefinition[] = [
  {
    id: "canopy-sprint",
    name: "Canopy Sprint",
    difficulty: "easy",
    summary: "Wide bends and forgiving timing windows.",
    pathPoints: [
      { x: 100, y: 600 },
      { x: 290, y: 540 },
      { x: 470, y: 470 },
      { x: 660, y: 390 },
      { x: 900, y: 310 },
      { x: 1130, y: 240 },
    ],
    spawnModifiers: {
      intervalMultiplier: 1.1,
      speedMultiplier: 0.92,
      waveSizeMultiplier: 0.9,
    },
    rewardMultiplier: 1,
  },
  {
    id: "river-split",
    name: "River Split",
    difficulty: "medium",
    summary: "Balanced curvature with tighter tower angles.",
    pathPoints: [
      { x: 120, y: 565 },
      { x: 300, y: 600 },
      { x: 520, y: 520 },
      { x: 650, y: 405 },
      { x: 860, y: 330 },
      { x: 1120, y: 210 },
    ],
    spawnModifiers: {
      intervalMultiplier: 1,
      speedMultiplier: 1,
      waveSizeMultiplier: 1,
    },
    rewardMultiplier: 1.08,
  },
  {
    id: "obsidian-switchback",
    name: "Obsidian Switchback",
    difficulty: "hard",
    summary: "Sharper turns and faster pressure ramp.",
    pathPoints: [
      { x: 90, y: 640 },
      { x: 230, y: 520 },
      { x: 420, y: 560 },
      { x: 620, y: 430 },
      { x: 760, y: 300 },
      { x: 940, y: 350 },
      { x: 1140, y: 180 },
    ],
    spawnModifiers: {
      intervalMultiplier: 0.92,
      speedMultiplier: 1.1,
      waveSizeMultiplier: 1.2,
    },
    rewardMultiplier: 1.2,
  },
];

export const DIFFICULTY_MODIFIERS: Record<
  DifficultyChoice,
  {
    speedMultiplier: number;
    intervalMultiplier: number;
    waveSizeMultiplier: number;
    rewardMultiplier: number;
  }
> = {
  easy: {
    speedMultiplier: 0.9,
    intervalMultiplier: 1.1,
    waveSizeMultiplier: 0.88,
    rewardMultiplier: 1,
  },
  medium: {
    speedMultiplier: 1,
    intervalMultiplier: 1,
    waveSizeMultiplier: 1,
    rewardMultiplier: 1.08,
  },
  hard: {
    speedMultiplier: 1.15,
    intervalMultiplier: 0.9,
    waveSizeMultiplier: 1.22,
    rewardMultiplier: 1.2,
  },
};

export const DEFAULT_MAP_ID = MAP_DEFINITIONS[0].id;

export function getMapById(mapId: string): MapDefinition {
  return MAP_DEFINITIONS.find((map) => map.id === mapId) ?? MAP_DEFINITIONS[0];
}
