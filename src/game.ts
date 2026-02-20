import {
  BALLOON_BASE_SPEED,
  BALLOON_COLORS,
  BALLOON_RADIUS,
  BALLOON_SPAWN_INTERVAL_MS,
  BASE_POP_SCORE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DART_LIFETIME_MS,
  DART_RADIUS,
  DART_SPEED,
  GAME_SEED,
  PATH_POINTS,
  SCRIPTED_SHOT_TIMINGS_MS,
  SPEED_ROUND_BALLOON_MULTIPLIER,
  SPEED_ROUND_DURATION_MS,
  SPEED_ROUND_INTERVAL_MS,
  SPEED_ROUND_SCORE_MULTIPLIER,
  START_LIVES,
  TOWER_POSITION,
  WAVE_BALLOON_STEP,
  WAVE_BASE_BALLOONS,
} from "./constants";
import { circlesOverlap } from "./collision";
import { seededRandom } from "./rng";
import type { Balloon, Dart, GameSnapshot, GameState, PathSegment, PendingEvent, Vec2 } from "./types";

const MAX_PENDING_EVENTS = 8;

interface PathInfo {
  segments: PathSegment[];
  totalLength: number;
}

const PATH_INFO = buildPathInfo(PATH_POINTS);

function buildPathInfo(points: readonly Vec2[]): PathInfo {
  const segments: PathSegment[] = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    totalLength += length;
    segments.push({ start, end, length });
  }

  return { segments, totalLength };
}

function pointOnPath(distance: number): Vec2 {
  if (distance <= 0) {
    return { ...PATH_INFO.segments[0].start };
  }

  if (distance >= PATH_INFO.totalLength) {
    return { ...PATH_INFO.segments[PATH_INFO.segments.length - 1].end };
  }

  let traversed = 0;
  for (const segment of PATH_INFO.segments) {
    if (traversed + segment.length >= distance) {
      const local = (distance - traversed) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * local,
        y: segment.start.y + (segment.end.y - segment.start.y) * local,
      };
    }
    traversed += segment.length;
  }

  return { ...PATH_INFO.segments[PATH_INFO.segments.length - 1].end };
}

function calcWaveTargetCount(wave: number): number {
  return WAVE_BASE_BALLOONS + Math.max(0, wave - 1) * WAVE_BALLOON_STEP;
}

function appendEvent(state: GameState, type: PendingEvent["type"], note: string): void {
  state.pendingEvents.push({ type, note, atMs: Math.round(state.elapsedMs) });
  if (state.pendingEvents.length > MAX_PENDING_EVENTS) {
    state.pendingEvents.splice(0, state.pendingEvents.length - MAX_PENDING_EVENTS);
  }
}

function nextColor(state: GameState): string {
  const index = Math.floor(state.rng() * BALLOON_COLORS.length) % BALLOON_COLORS.length;
  return BALLOON_COLORS[index];
}

function speedMultiplier(state: GameState): number {
  return state.speedRoundActive ? SPEED_ROUND_BALLOON_MULTIPLIER : 1;
}

function scoreMultiplier(state: GameState): number {
  return state.speedRoundActive ? SPEED_ROUND_SCORE_MULTIPLIER : 1;
}

function spawnBalloon(state: GameState): void {
  if (state.spawnedInWave >= state.waveTargetCount) {
    return;
  }

  const startPoint = pointOnPath(0);
  const waveBoost = 1 + (state.wave - 1) * 0.05;
  const speedVariance = 0.9 + state.rng() * 0.25;

  const balloon: Balloon = {
    id: state.nextEntityId,
    x: startPoint.x,
    y: startPoint.y,
    radius: BALLOON_RADIUS,
    distance: 0,
    speed: BALLOON_BASE_SPEED * waveBoost * speedVariance,
    color: nextColor(state),
  };

  state.nextEntityId += 1;
  state.spawnedInWave += 1;
  state.balloons.push(balloon);
}

function updateSpeedRoundWindow(state: GameState): void {
  if (state.speedRoundActive && state.elapsedMs >= state.speedRoundEndsAtMs) {
    state.speedRoundActive = false;
    appendEvent(state, "speed_round_end", `wave:${state.wave}`);
  }

  if (!state.speedRoundActive && state.elapsedMs >= state.nextSpeedRoundAtMs) {
    state.speedRoundActive = true;
    state.speedRoundEndsAtMs = state.elapsedMs + SPEED_ROUND_DURATION_MS;
    state.nextSpeedRoundAtMs += SPEED_ROUND_INTERVAL_MS;
    appendEvent(state, "speed_round_start", `wave:${state.wave}`);
  }
}

export function createInitialState(seed = GAME_SEED, scriptedDemo = false): GameState {
  return {
    mode: "title",
    score: 0,
    lives: START_LIVES,
    wave: 1,
    elapsedMs: 0,
    speedRoundActive: false,
    speedRoundEndsAtMs: 0,
    nextSpeedRoundAtMs: SPEED_ROUND_INTERVAL_MS,
    balloons: [],
    darts: [],
    poppedTotal: 0,
    pendingEvents: [],
    seed,
    scriptedDemo,
    scriptedShotCursor: 0,
    spawnCooldownMs: 0,
    spawnedInWave: 0,
    waveTargetCount: calcWaveTargetCount(1),
    nextEntityId: 1,
    rng: seededRandom(seed),
  };
}

export function startPlaying(state: GameState): void {
  if (state.mode === "title" || state.mode === "game_over") {
    state.mode = "playing";
  }
}

export function resetToTitle(seed: string, scriptedDemo: boolean): GameState {
  return createInitialState(seed, scriptedDemo);
}

export function togglePause(state: GameState): void {
  if (state.mode === "playing") {
    state.mode = "paused";
  } else if (state.mode === "paused") {
    state.mode = "playing";
  }
}

export function fireDartAt(
  state: GameState,
  targetX: number,
  targetY: number,
  targetBalloonId: number | null = null,
): void {
  if (state.mode !== "playing") {
    return;
  }

  const dx = targetX - TOWER_POSITION.x;
  const dy = targetY - TOWER_POSITION.y;
  const magnitude = Math.hypot(dx, dy);

  if (magnitude <= 0.0001) {
    return;
  }

  const dart: Dart = {
    id: state.nextEntityId,
    x: TOWER_POSITION.x,
    y: TOWER_POSITION.y,
    vx: (dx / magnitude) * DART_SPEED,
    vy: (dy / magnitude) * DART_SPEED,
    radius: DART_RADIUS,
    ttlMs: DART_LIFETIME_MS,
    targetBalloonId,
  };

  state.nextEntityId += 1;
  state.darts.push(dart);
}

function fireGuidedDartAtLeadBalloon(state: GameState): void {
  if (state.balloons.length === 0) {
    fireDartAt(state, PATH_POINTS[1].x, PATH_POINTS[1].y, null);
    return;
  }

  let lead = state.balloons[0];
  for (const balloon of state.balloons) {
    if (balloon.distance > lead.distance) {
      lead = balloon;
    }
  }

  fireDartAt(state, lead.x, lead.y, lead.id);
}

function runScriptedShotSchedule(state: GameState): void {
  while (
    state.scriptedShotCursor < SCRIPTED_SHOT_TIMINGS_MS.length &&
    state.elapsedMs >= SCRIPTED_SHOT_TIMINGS_MS[state.scriptedShotCursor]
  ) {
    fireGuidedDartAtLeadBalloon(state);
    state.scriptedShotCursor += 1;
  }
}

function updateBalloons(state: GameState, deltaSeconds: number): void {
  const survivors: Balloon[] = [];
  const moveScale = speedMultiplier(state);

  for (const balloon of state.balloons) {
    const nextDistance = balloon.distance + balloon.speed * moveScale * deltaSeconds;
    if (nextDistance >= PATH_INFO.totalLength) {
      state.lives -= 1;
      appendEvent(state, "life_lost", `lives:${state.lives}`);
      continue;
    }

    const point = pointOnPath(nextDistance);
    balloon.distance = nextDistance;
    balloon.x = point.x;
    balloon.y = point.y;
    survivors.push(balloon);
  }

  state.balloons = survivors;
}

function updateDarts(state: GameState, deltaSeconds: number, deltaMs: number): void {
  const activeBalloonById = new Map(state.balloons.map((balloon) => [balloon.id, balloon]));
  const survivors: Dart[] = [];

  for (const dart of state.darts) {
    dart.ttlMs -= deltaMs;
    if (dart.ttlMs <= 0) {
      continue;
    }

    if (dart.targetBalloonId != null) {
      const target = activeBalloonById.get(dart.targetBalloonId);
      if (target) {
        const dx = target.x - dart.x;
        const dy = target.y - dart.y;
        const mag = Math.hypot(dx, dy);
        if (mag > 0.0001) {
          dart.vx = (dx / mag) * DART_SPEED;
          dart.vy = (dy / mag) * DART_SPEED;
        }
      }
    }

    dart.x += dart.vx * deltaSeconds;
    dart.y += dart.vy * deltaSeconds;

    const outOfBounds = dart.x < -40 || dart.x > CANVAS_WIDTH + 40 || dart.y < -40 || dart.y > CANVAS_HEIGHT + 40;
    if (outOfBounds) {
      continue;
    }

    survivors.push(dart);
  }

  state.darts = survivors;
}

function resolveCollisions(state: GameState): void {
  if (state.darts.length === 0 || state.balloons.length === 0) {
    return;
  }

  const balloonIdsToRemove = new Set<number>();
  const dartIdsToRemove = new Set<number>();

  for (const dart of state.darts) {
    if (dartIdsToRemove.has(dart.id)) {
      continue;
    }

    for (const balloon of state.balloons) {
      if (balloonIdsToRemove.has(balloon.id)) {
        continue;
      }

      if (circlesOverlap(dart.x, dart.y, dart.radius, balloon.x, balloon.y, balloon.radius)) {
        balloonIdsToRemove.add(balloon.id);
        dartIdsToRemove.add(dart.id);
        break;
      }
    }
  }

  if (balloonIdsToRemove.size === 0) {
    return;
  }

  state.balloons = state.balloons.filter((balloon) => !balloonIdsToRemove.has(balloon.id));
  state.darts = state.darts.filter((dart) => !dartIdsToRemove.has(dart.id));

  const poppedCount = balloonIdsToRemove.size;
  state.poppedTotal += poppedCount;
  state.score += Math.round(BASE_POP_SCORE * scoreMultiplier(state) * poppedCount);
  appendEvent(state, "pop", `x${poppedCount} score:${state.score}`);
}

function maybeStartNextWave(state: GameState): void {
  const waveIsComplete = state.spawnedInWave >= state.waveTargetCount && state.balloons.length === 0;
  if (!waveIsComplete || state.mode !== "playing") {
    return;
  }

  state.wave += 1;
  state.waveTargetCount = calcWaveTargetCount(state.wave);
  state.spawnedInWave = 0;
  state.spawnCooldownMs = 0;
  appendEvent(state, "wave_start", `wave:${state.wave}`);
}

export function updateGame(state: GameState, deltaMs: number): void {
  if (state.mode !== "playing" || deltaMs <= 0) {
    return;
  }

  state.elapsedMs += deltaMs;
  updateSpeedRoundWindow(state);

  state.spawnCooldownMs += deltaMs;
  while (state.spawnedInWave < state.waveTargetCount && state.spawnCooldownMs >= BALLOON_SPAWN_INTERVAL_MS) {
    spawnBalloon(state);
    state.spawnCooldownMs -= BALLOON_SPAWN_INTERVAL_MS;
  }

  if (state.scriptedDemo) {
    runScriptedShotSchedule(state);
  }

  const deltaSeconds = deltaMs / 1000;
  updateDarts(state, deltaSeconds, deltaMs);
  updateBalloons(state, deltaSeconds);
  resolveCollisions(state);
  updateSpeedRoundWindow(state);

  if (state.lives <= 0) {
    state.mode = "game_over";
    appendEvent(state, "game_over", `score:${state.score}`);
    return;
  }

  maybeStartNextWave(state);
}

export function snapshotState(state: GameState): GameSnapshot {
  return {
    mode: state.mode,
    score: state.score,
    lives: state.lives,
    wave: state.wave,
    elapsedMs: Math.round(state.elapsedMs),
    speedRoundActive: state.speedRoundActive,
    speedRoundEndsInMs: state.speedRoundActive ? Math.max(0, Math.round(state.speedRoundEndsAtMs - state.elapsedMs)) : 0,
    balloonsAlive: state.balloons.length,
    dartsAlive: state.darts.length,
    poppedTotal: state.poppedTotal,
    seed: state.seed,
    pendingEvents: state.pendingEvents.map((event) => `${event.type}:${event.note}`),
  };
}

export function renderGameToText(state: GameState): string {
  return JSON.stringify(snapshotState(state));
}
