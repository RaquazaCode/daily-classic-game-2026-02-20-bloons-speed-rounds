import {
  BALLOON_BASE_SPEED,
  BALLOON_COLORS,
  BALLOON_MARKERS,
  BALLOON_RADIUS,
  BALLOON_SPAWN_INTERVAL_MS,
  BASE_POP_SCORE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DART_LIFETIME_MS,
  DART_POOL_CAPACITY,
  DART_RADIUS,
  DART_SPEED,
  GAME_SEED,
  HIT_MARKER_DURATION_MS,
  MUZZLE_FLASH_DURATION_MS,
  PARTICLE_POOL_CAPACITY,
  POP_PARTICLES_PER_BALLOON,
  SCORE_TICK_DURATION_MS,
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
import { DEFAULT_MAP_ID, DIFFICULTY_MODIFIERS, getMapById } from "./data/maps";
import { seededRandom } from "./rng";
import type {
  Balloon,
  Dart,
  DifficultyChoice,
  GameSnapshot,
  GameState,
  Particle,
  PathSegment,
  PendingEvent,
  Vec2,
} from "./types";

const MAX_PENDING_EVENTS = 8;

interface PathInfo {
  segments: PathSegment[];
  totalLength: number;
}

interface RunModifiers {
  speedMultiplier: number;
  intervalMultiplier: number;
  waveSizeMultiplier: number;
  rewardMultiplier: number;
}

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

function pointOnPath(state: GameState, distance: number): Vec2 {
  if (distance <= 0) {
    return { ...state.pathSegments[0].start };
  }

  if (distance >= state.pathTotalLength) {
    return { ...state.pathSegments[state.pathSegments.length - 1].end };
  }

  let traversed = 0;
  for (const segment of state.pathSegments) {
    if (traversed + segment.length >= distance) {
      const local = (distance - traversed) / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * local,
        y: segment.start.y + (segment.end.y - segment.start.y) * local,
      };
    }
    traversed += segment.length;
  }

  return { ...state.pathSegments[state.pathSegments.length - 1].end };
}

function getRunModifiers(state: GameState): RunModifiers {
  const map = getMapById(state.selectedMapId);
  const difficulty = DIFFICULTY_MODIFIERS[state.selectedDifficulty];
  return {
    speedMultiplier: map.spawnModifiers.speedMultiplier * difficulty.speedMultiplier,
    intervalMultiplier: map.spawnModifiers.intervalMultiplier * difficulty.intervalMultiplier,
    waveSizeMultiplier: map.spawnModifiers.waveSizeMultiplier * difficulty.waveSizeMultiplier,
    rewardMultiplier: map.rewardMultiplier * difficulty.rewardMultiplier,
  };
}

function calcWaveTargetCount(wave: number, waveSizeMultiplier: number): number {
  const baseline = WAVE_BASE_BALLOONS + Math.max(0, wave - 1) * WAVE_BALLOON_STEP;
  return Math.max(4, Math.round(baseline * waveSizeMultiplier));
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

function nextMarker(state: GameState): Balloon["marker"] {
  const index = Math.floor(state.rng() * BALLOON_MARKERS.length) % BALLOON_MARKERS.length;
  return BALLOON_MARKERS[index];
}

function speedMultiplier(state: GameState): number {
  return state.speedRoundActive ? SPEED_ROUND_BALLOON_MULTIPLIER : 1;
}

function scoreMultiplier(state: GameState): number {
  return state.speedRoundActive ? SPEED_ROUND_SCORE_MULTIPLIER : 1;
}

function acquireDart(state: GameState): Dart {
  const existing = state.dartPool.pop();
  if (existing) {
    return existing;
  }

  return {
    id: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: DART_RADIUS,
    ttlMs: DART_LIFETIME_MS,
    targetBalloonId: null,
  };
}

function releaseDart(state: GameState, dart: Dart): void {
  if (state.dartPool.length >= DART_POOL_CAPACITY) {
    return;
  }
  state.dartPool.push(dart);
}

function acquireParticle(state: GameState): Particle {
  const existing = state.particlePool.pop();
  if (existing) {
    return existing;
  }

  return {
    id: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ttlMs: 0,
    radius: 3,
    color: "#ffffff",
  };
}

function releaseParticle(state: GameState, particle: Particle): void {
  if (state.particlePool.length >= PARTICLE_POOL_CAPACITY) {
    return;
  }
  state.particlePool.push(particle);
}

function applyPathForMap(state: GameState, mapId: string): void {
  const map = getMapById(mapId);
  const pathPoints = map.pathPoints.map((point) => ({ ...point }));
  const path = buildPathInfo(pathPoints);
  state.selectedMapId = map.id;
  state.pathPoints = pathPoints;
  state.pathSegments = path.segments;
  state.pathTotalLength = path.totalLength;
}

function resetRunProgress(state: GameState): void {
  const modifiers = getRunModifiers(state);
  state.score = 0;
  state.lives = START_LIVES;
  state.wave = 1;
  state.elapsedMs = 0;
  state.speedRoundActive = false;
  state.speedRoundEndsAtMs = 0;
  state.nextSpeedRoundAtMs = SPEED_ROUND_INTERVAL_MS;
  state.balloons = [];

  for (const dart of state.darts) {
    releaseDart(state, dart);
  }
  state.darts = [];

  for (const particle of state.particles) {
    releaseParticle(state, particle);
  }
  state.particles = [];

  state.poppedTotal = 0;
  state.pendingEvents = [];
  state.scriptedShotCursor = 0;
  state.spawnCooldownMs = 0;
  state.spawnedInWave = 0;
  state.waveTargetCount = calcWaveTargetCount(1, modifiers.waveSizeMultiplier);
  state.muzzleFlashMs = 0;
  state.hitMarkerMs = 0;
  state.hitMarkerX = TOWER_POSITION.x;
  state.hitMarkerY = TOWER_POSITION.y;
  state.scoreTickValue = 0;
  state.scoreTickMs = 0;
}

function spawnBalloon(state: GameState): void {
  if (state.spawnedInWave >= state.waveTargetCount) {
    return;
  }

  const modifiers = getRunModifiers(state);
  const startPoint = pointOnPath(state, 0);
  const waveBoost = 1 + (state.wave - 1) * 0.05;
  const speedVariance = 0.9 + state.rng() * 0.25;

  const balloon: Balloon = {
    id: state.nextEntityId,
    x: startPoint.x,
    y: startPoint.y,
    radius: BALLOON_RADIUS,
    distance: 0,
    speed: BALLOON_BASE_SPEED * waveBoost * speedVariance * modifiers.speedMultiplier,
    color: nextColor(state),
    marker: nextMarker(state),
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

function spawnPopParticles(state: GameState, x: number, y: number, color: string): void {
  for (let index = 0; index < POP_PARTICLES_PER_BALLOON; index += 1) {
    const angle = (Math.PI * 2 * index) / POP_PARTICLES_PER_BALLOON + state.rng() * 0.4;
    const speed = 90 + state.rng() * 120;
    const particle = acquireParticle(state);
    particle.id = state.nextEntityId;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.ttlMs = 180 + state.rng() * 220;
    particle.radius = 2.6 + state.rng() * 2.1;
    particle.color = color;
    state.nextEntityId += 1;
    state.particles.push(particle);
  }
}

function tickFeedback(state: GameState, deltaMs: number): void {
  state.muzzleFlashMs = Math.max(0, state.muzzleFlashMs - deltaMs);
  state.hitMarkerMs = Math.max(0, state.hitMarkerMs - deltaMs);
  state.scoreTickMs = Math.max(0, state.scoreTickMs - deltaMs);
  if (state.scoreTickMs === 0) {
    state.scoreTickValue = 0;
  }
}

export function createInitialState(
  seed = GAME_SEED,
  scriptedDemo = false,
  selectedMapId = DEFAULT_MAP_ID,
  selectedDifficulty: DifficultyChoice = "medium",
): GameState {
  const map = getMapById(selectedMapId);
  const pathPoints = map.pathPoints.map((point) => ({ ...point }));
  const path = buildPathInfo(pathPoints);

  const initialState: GameState = {
    mode: "title",
    screen: "title",
    score: 0,
    lives: START_LIVES,
    selectedMapId: map.id,
    selectedDifficulty,
    wave: 1,
    elapsedMs: 0,
    speedRoundActive: false,
    speedRoundEndsAtMs: 0,
    nextSpeedRoundAtMs: SPEED_ROUND_INTERVAL_MS,
    balloons: [],
    darts: [],
    dartPool: [],
    particles: [],
    particlePool: [],
    poppedTotal: 0,
    pendingEvents: [],
    seed,
    scriptedDemo,
    scriptedShotCursor: 0,
    spawnCooldownMs: 0,
    spawnedInWave: 0,
    waveTargetCount: WAVE_BASE_BALLOONS,
    nextEntityId: 1,
    pathPoints,
    pathSegments: path.segments,
    pathTotalLength: path.totalLength,
    muzzleFlashMs: 0,
    hitMarkerMs: 0,
    hitMarkerX: TOWER_POSITION.x,
    hitMarkerY: TOWER_POSITION.y,
    scoreTickValue: 0,
    scoreTickMs: 0,
    rng: seededRandom(seed),
  };

  resetRunProgress(initialState);
  return initialState;
}

export function goToMapSelect(state: GameState): void {
  state.screen = "map_select";
  state.mode = "title";
}

export function selectMap(state: GameState, mapId: string): void {
  applyPathForMap(state, mapId);
  state.screen = "difficulty_select";
  state.mode = "title";
}

export function selectDifficulty(state: GameState, difficulty: DifficultyChoice): void {
  state.selectedDifficulty = difficulty;
}

export function startPlaying(state: GameState): void {
  resetRunProgress(state);
  state.mode = "playing";
  state.screen = "playing";
}

export function resetToTitle(state: GameState): void {
  resetRunProgress(state);
  state.mode = "title";
  state.screen = "title";
}

export function togglePause(state: GameState): void {
  if (state.mode === "playing") {
    state.mode = "paused";
    state.screen = "paused";
  } else if (state.mode === "paused") {
    state.mode = "playing";
    state.screen = "playing";
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

  const dart = acquireDart(state);
  dart.id = state.nextEntityId;
  dart.x = TOWER_POSITION.x;
  dart.y = TOWER_POSITION.y;
  dart.vx = (dx / magnitude) * DART_SPEED;
  dart.vy = (dy / magnitude) * DART_SPEED;
  dart.radius = DART_RADIUS;
  dart.ttlMs = DART_LIFETIME_MS;
  dart.targetBalloonId = targetBalloonId;

  state.nextEntityId += 1;
  state.darts.push(dart);
  state.muzzleFlashMs = MUZZLE_FLASH_DURATION_MS;
}

function fireGuidedDartAtLeadBalloon(state: GameState): void {
  if (state.balloons.length === 0) {
    const fallback = state.pathPoints[Math.min(1, state.pathPoints.length - 1)];
    fireDartAt(state, fallback.x, fallback.y, null);
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
    if (nextDistance >= state.pathTotalLength) {
      state.lives -= 1;
      appendEvent(state, "life_lost", `lives:${state.lives}`);
      continue;
    }

    const point = pointOnPath(state, nextDistance);
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
      releaseDart(state, dart);
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
      releaseDart(state, dart);
      continue;
    }

    survivors.push(dart);
  }

  state.darts = survivors;
}

function updateParticles(state: GameState, deltaSeconds: number, deltaMs: number): void {
  const survivors: Particle[] = [];

  for (const particle of state.particles) {
    particle.ttlMs -= deltaMs;
    if (particle.ttlMs <= 0) {
      releaseParticle(state, particle);
      continue;
    }

    particle.x += particle.vx * deltaSeconds;
    particle.y += particle.vy * deltaSeconds;
    particle.vx *= 0.93;
    particle.vy *= 0.93;

    survivors.push(particle);
  }

  state.particles = survivors;
}

function resolveCollisions(state: GameState): void {
  if (state.darts.length === 0 || state.balloons.length === 0) {
    return;
  }

  const balloonIdsToRemove = new Set<number>();
  const dartIdsToRemove = new Set<number>();
  const poppedBalloons: Balloon[] = [];

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
        poppedBalloons.push(balloon);
        break;
      }
    }
  }

  if (balloonIdsToRemove.size === 0) {
    return;
  }

  state.balloons = state.balloons.filter((balloon) => !balloonIdsToRemove.has(balloon.id));

  const remainingDarts: Dart[] = [];
  for (const dart of state.darts) {
    if (dartIdsToRemove.has(dart.id)) {
      releaseDart(state, dart);
      continue;
    }
    remainingDarts.push(dart);
  }
  state.darts = remainingDarts;

  for (const balloon of poppedBalloons) {
    spawnPopParticles(state, balloon.x, balloon.y, balloon.color);
  }

  const poppedCount = balloonIdsToRemove.size;
  const scoreDelta = Math.round(BASE_POP_SCORE * scoreMultiplier(state) * poppedCount * getRunModifiers(state).rewardMultiplier);
  state.poppedTotal += poppedCount;
  state.score += scoreDelta;
  state.hitMarkerMs = HIT_MARKER_DURATION_MS;
  state.hitMarkerX = poppedBalloons[0].x;
  state.hitMarkerY = poppedBalloons[0].y;
  state.scoreTickValue = scoreDelta;
  state.scoreTickMs = SCORE_TICK_DURATION_MS;
  appendEvent(state, "pop", `x${poppedCount} score:${state.score}`);
}

function maybeStartNextWave(state: GameState): void {
  const waveIsComplete = state.spawnedInWave >= state.waveTargetCount && state.balloons.length === 0;
  if (!waveIsComplete || state.mode !== "playing") {
    return;
  }

  state.wave += 1;
  const modifiers = getRunModifiers(state);
  state.waveTargetCount = calcWaveTargetCount(state.wave, modifiers.waveSizeMultiplier);
  state.spawnedInWave = 0;
  state.spawnCooldownMs = 0;
  appendEvent(state, "wave_start", `wave:${state.wave}`);
}

export function updateGame(state: GameState, deltaMs: number): void {
  if (deltaMs <= 0) {
    return;
  }

  if (state.mode !== "playing") {
    tickFeedback(state, deltaMs);
    return;
  }

  state.elapsedMs += deltaMs;
  updateSpeedRoundWindow(state);

  const modifiers = getRunModifiers(state);
  const spawnInterval = BALLOON_SPAWN_INTERVAL_MS * modifiers.intervalMultiplier;

  state.spawnCooldownMs += deltaMs;
  while (state.spawnedInWave < state.waveTargetCount && state.spawnCooldownMs >= spawnInterval) {
    spawnBalloon(state);
    state.spawnCooldownMs -= spawnInterval;
  }

  if (state.scriptedDemo) {
    runScriptedShotSchedule(state);
  }

  const deltaSeconds = deltaMs / 1000;
  updateDarts(state, deltaSeconds, deltaMs);
  updateBalloons(state, deltaSeconds);
  resolveCollisions(state);
  updateParticles(state, deltaSeconds, deltaMs);
  updateSpeedRoundWindow(state);
  tickFeedback(state, deltaMs);

  if (state.lives <= 0) {
    state.mode = "game_over";
    state.screen = "game_over";
    appendEvent(state, "game_over", `score:${state.score}`);
    return;
  }

  maybeStartNextWave(state);
}

export function snapshotState(state: GameState): GameSnapshot {
  return {
    mode: state.mode,
    screen: state.screen,
    score: state.score,
    lives: state.lives,
    wave: state.wave,
    selectedMapId: state.selectedMapId,
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
