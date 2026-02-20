export type Mode = "title" | "playing" | "paused" | "game_over";

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
  x: number;
  y: number;
  radius: number;
  distance: number;
  speed: number;
  color: string;
}

export interface Dart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttlMs: number;
  targetBalloonId: number | null;
}

export interface PendingEvent {
  type: "pop" | "life_lost" | "speed_round_start" | "speed_round_end" | "wave_start" | "game_over";
  atMs: number;
  note: string;
}

export interface GameState {
  mode: Mode;
  score: number;
  lives: number;
  wave: number;
  elapsedMs: number;
  speedRoundActive: boolean;
  speedRoundEndsAtMs: number;
  nextSpeedRoundAtMs: number;
  balloons: Balloon[];
  darts: Dart[];
  poppedTotal: number;
  pendingEvents: PendingEvent[];
  seed: string;
  scriptedDemo: boolean;
  scriptedShotCursor: number;
  spawnCooldownMs: number;
  spawnedInWave: number;
  waveTargetCount: number;
  nextEntityId: number;
  rng: () => number;
}

export interface GameSnapshot {
  mode: Mode;
  score: number;
  lives: number;
  wave: number;
  elapsedMs: number;
  speedRoundActive: boolean;
  speedRoundEndsInMs: number;
  balloonsAlive: number;
  dartsAlive: number;
  poppedTotal: number;
  seed: string;
  pendingEvents: string[];
}
