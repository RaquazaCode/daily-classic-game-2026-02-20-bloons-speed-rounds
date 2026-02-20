import { TOWER_DEFINITIONS } from "../data/towers";
import type { Balloon, PlacedTower, TowerTypeId, Vec2 } from "../types";

const TOWER_COLLISION_RADIUS = 34;
const PATH_BLOCK_RADIUS = 32;

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function pointToSegmentDistance(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const px = start.x + clamped * dx;
  const py = start.y + clamped * dy;
  return Math.hypot(point.x - px, point.y - py);
}

export function canPlaceTower(pathPoints: Vec2[], towers: PlacedTower[], x: number, y: number): boolean {
  if (x < 60 || x > 1220 || y < 120 || y > 660) {
    return false;
  }

  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const dist = pointToSegmentDistance({ x, y }, pathPoints[index], pathPoints[index + 1]);
    if (dist < PATH_BLOCK_RADIUS) {
      return false;
    }
  }

  for (const tower of towers) {
    if (distanceSquared(tower.x, tower.y, x, y) < (TOWER_COLLISION_RADIUS * 2) ** 2) {
      return false;
    }
  }

  return true;
}

export function findTowerAt(towers: PlacedTower[], x: number, y: number): PlacedTower | null {
  for (const tower of towers) {
    if (distanceSquared(tower.x, tower.y, x, y) <= (TOWER_COLLISION_RADIUS + 8) ** 2) {
      return tower;
    }
  }
  return null;
}

export function findLeadTarget(tower: PlacedTower, balloons: Balloon[]): Balloon | null {
  let best: Balloon | null = null;
  const rangeSq = tower.range * tower.range;

  for (const balloon of balloons) {
    if (distanceSquared(tower.x, tower.y, balloon.x, balloon.y) > rangeSq) {
      continue;
    }
    if (!best || balloon.distance > best.distance) {
      best = balloon;
    }
  }

  return best;
}

export function createTowerFromDefinition(id: number, typeId: TowerTypeId, x: number, y: number): PlacedTower {
  const definition = TOWER_DEFINITIONS[typeId];
  return {
    id,
    typeId,
    x,
    y,
    range: definition.range,
    fireCooldownMs: 0,
    fireRateMs: definition.fireRateMs,
    damage: definition.damage,
    level: 1,
  };
}

export function getNextUpgradeCost(tower: PlacedTower): number | null {
  const definition = TOWER_DEFINITIONS[tower.typeId];
  const upgradeIndex = tower.level - 1;
  const upgrade = definition.upgrades[upgradeIndex];
  return upgrade ? upgrade.cost : null;
}

export function applyTowerUpgrade(tower: PlacedTower): boolean {
  const definition = TOWER_DEFINITIONS[tower.typeId];
  const upgradeIndex = tower.level - 1;
  const upgrade = definition.upgrades[upgradeIndex];
  if (!upgrade) {
    return false;
  }

  tower.level += 1;
  tower.damage += upgrade.damageDelta;
  tower.fireRateMs = Math.max(300, Math.round(tower.fireRateMs * upgrade.fireRateMultiplier));
  tower.range += upgrade.rangeDelta;
  return true;
}
