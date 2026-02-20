export type Mode = "title" | "playing" | "paused" | "game_over";
export type Screen = "title" | "map_select" | "difficulty_select" | "playing" | "paused" | "game_over";
export type DifficultyChoice = "easy" | "medium" | "hard";
export type TowerTypeId = "dart_monkey" | "tack_sprayer" | "ice_tower" | "sniper";
export type BalloonTier = "red" | "blue" | "green" | "black";

export interface Vec2 {
  x: number;
  y: number;
}

export interface PathSegment {
  start: Vec2;
  end: Vec2;
  length: number;
}

export interface Balloon {
  id: number;
  tier: BalloonTier;
  x: number;
  y: number;
  radius: number;
  distance: number;
  speed: number;
  health: number;
  maxHealth: number;
  reward: number;
  resistantToIce: boolean;
  slowUntilMs: number;
  color: string;
  marker: "dot" | "ring" | "stripe" | "cross";
}

export interface Dart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttlMs: number;
  damage: number;
  color: string;
  slowMs: number;
  targetBalloonId: number | null;
}

export interface PlacedTower {
  id: number;
  typeId: TowerTypeId;
  x: number;
  y: number;
  range: number;
  fireCooldownMs: number;
  fireRateMs: number;
  damage: number;
  level: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttlMs: number;
  radius: number;
  color: string;
}

export interface PendingEvent {
  type: "pop" | "life_lost" | "speed_round_start" | "speed_round_end" | "wave_start" | "game_over";
  atMs: number;
  note: string;
}

export interface GameState {
  mode: Mode;
  screen: Screen;
  score: number;
  coins: number;
  lives: number;
  selectedMapId: string;
  selectedDifficulty: DifficultyChoice;
  placingTowerType: TowerTypeId | null;
  wave: number;
  elapsedMs: number;
  speedRoundActive: boolean;
  speedRoundEndsAtMs: number;
  nextSpeedRoundAtMs: number;
  balloons: Balloon[];
  towers: PlacedTower[];
  darts: Dart[];
  dartPool: Dart[];
  particles: Particle[];
  particlePool: Particle[];
  wavePlan: BalloonTier[];
  waveSpawnCursor: number;
  poppedTotal: number;
  pendingEvents: PendingEvent[];
  seed: string;
  scriptedDemo: boolean;
  scriptedShotCursor: number;
  spawnCooldownMs: number;
  spawnedInWave: number;
  waveTargetCount: number;
  nextEntityId: number;
  pathPoints: Vec2[];
  pathSegments: PathSegment[];
  pathTotalLength: number;
  muzzleFlashMs: number;
  hitMarkerMs: number;
  hitMarkerX: number;
  hitMarkerY: number;
  scoreTickValue: number;
  scoreTickMs: number;
  rng: () => number;
}

export interface GameSnapshot {
  mode: Mode;
  screen: Screen;
  score: number;
  coins: number;
  lives: number;
  wave: number;
  selectedMapId: string;
  elapsedMs: number;
  speedRoundActive: boolean;
  speedRoundEndsInMs: number;
  balloonsAlive: number;
  towersPlaced: number;
  projectilesAlive: number;
  poppedTotal: number;
  seed: string;
  pendingEvents: string[];
}
