export const GAME_TITLE = "Bloons Speed Rounds";
export const GAME_SEED = "2026-02-20-bloons-speed-rounds";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const FIXED_STEP_MS = 1000 / 60;

export const TOWER_POSITION = {
  x: 1090,
  y: 618,
};

export const START_BUTTON = {
  x: CANVAS_WIDTH / 2 - 160,
  y: CANVAS_HEIGHT / 2 + 82,
  width: 320,
  height: 68,
};

export const START_LIVES = 20;
export const BASE_POP_SCORE = 10;

export const BALLOON_RADIUS = 18;
export const BALLOON_BASE_SPEED = 110;
export const BALLOON_SPAWN_INTERVAL_MS = 700;
export const WAVE_BASE_BALLOONS = 12;
export const WAVE_BALLOON_STEP = 4;

export const DART_RADIUS = 8;
export const DART_SPEED = 980;
export const DART_LIFETIME_MS = 1400;
export const DART_POOL_CAPACITY = 180;

export const POP_PARTICLES_PER_BALLOON = 8;
export const PARTICLE_POOL_CAPACITY = 512;
export const MUZZLE_FLASH_DURATION_MS = 120;
export const HIT_MARKER_DURATION_MS = 180;
export const SCORE_TICK_DURATION_MS = 560;

export const BALLOON_MARKERS = ["dot", "ring", "stripe", "cross"] as const;

export const SPEED_ROUND_INTERVAL_MS = 20000;
export const SPEED_ROUND_DURATION_MS = 8000;
export const SPEED_ROUND_BALLOON_MULTIPLIER = 1.75;
export const SPEED_ROUND_SCORE_MULTIPLIER = 2;

export const BALLOON_COLORS = ["#f7d14b", "#69d1ff", "#ff7aa2", "#9dff98", "#ff9f59"];

export const PATH_POINTS = [
  { x: 120, y: 575 },
  { x: 270, y: 525 },
  { x: 455, y: 445 },
  { x: 650, y: 365 },
  { x: 900, y: 280 },
  { x: 1125, y: 205 },
] as const;

export const SCRIPTED_SHOT_TIMINGS_MS = [1200, 1800, 2400, 3000, 3800, 4600, 5600, 6600, 7600, 8600, 9600];
