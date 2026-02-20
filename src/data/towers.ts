import type { TowerTypeId } from "../types";

export interface TowerUpgradeStep {
  cost: number;
  damageDelta: number;
  fireRateMultiplier: number;
  rangeDelta: number;
}

export interface TowerDefinition {
  id: TowerTypeId;
  name: string;
  cost: number;
  unlockWave: number;
  range: number;
  fireRateMs: number;
  damage: number;
  projectileSpeed: number;
  projectileColor: string;
  mode: "single" | "radial";
  radialProjectiles?: number;
  slowMs?: number;
  upgrades: [TowerUpgradeStep, TowerUpgradeStep];
}

export const TOWER_DEFINITIONS: Record<TowerTypeId, TowerDefinition> = {
  dart_monkey: {
    id: "dart_monkey",
    name: "Dart Monkey",
    cost: 80,
    unlockWave: 1,
    range: 220,
    fireRateMs: 920,
    damage: 1,
    projectileSpeed: 760,
    projectileColor: "#f0f7ff",
    mode: "single",
    upgrades: [
      { cost: 80, damageDelta: 1, fireRateMultiplier: 0.9, rangeDelta: 20 },
      { cost: 120, damageDelta: 1, fireRateMultiplier: 0.85, rangeDelta: 25 },
    ],
  },
  tack_sprayer: {
    id: "tack_sprayer",
    name: "Tack Sprayer",
    cost: 140,
    unlockWave: 2,
    range: 145,
    fireRateMs: 1200,
    damage: 1,
    projectileSpeed: 610,
    projectileColor: "#ffd286",
    mode: "radial",
    radialProjectiles: 6,
    upgrades: [
      { cost: 110, damageDelta: 1, fireRateMultiplier: 0.9, rangeDelta: 15 },
      { cost: 160, damageDelta: 1, fireRateMultiplier: 0.82, rangeDelta: 20 },
    ],
  },
  ice_tower: {
    id: "ice_tower",
    name: "Ice Tower",
    cost: 180,
    unlockWave: 3,
    range: 165,
    fireRateMs: 1450,
    damage: 1,
    projectileSpeed: 540,
    projectileColor: "#b8eeff",
    mode: "single",
    slowMs: 1100,
    upgrades: [
      { cost: 130, damageDelta: 1, fireRateMultiplier: 0.9, rangeDelta: 20 },
      { cost: 180, damageDelta: 1, fireRateMultiplier: 0.84, rangeDelta: 25 },
    ],
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    cost: 260,
    unlockWave: 4,
    range: 960,
    fireRateMs: 1800,
    damage: 2,
    projectileSpeed: 1300,
    projectileColor: "#f2f9ff",
    mode: "single",
    upgrades: [
      { cost: 170, damageDelta: 1, fireRateMultiplier: 0.88, rangeDelta: 0 },
      { cost: 240, damageDelta: 2, fireRateMultiplier: 0.8, rangeDelta: 0 },
    ],
  },
};

export const TOWER_ORDER: TowerTypeId[] = ["dart_monkey", "tack_sprayer", "ice_tower", "sniper"];

export function towerUnlockedByWave(typeId: TowerTypeId, wave: number): boolean {
  return wave >= TOWER_DEFINITIONS[typeId].unlockWave;
}
