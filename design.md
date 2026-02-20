# Bloons Speed Rounds - Design

## Goal
Build a deterministic, unattended-safe Bloons-inspired web game MVP with one twist (`speed rounds`) and automation-friendly verification hooks.

## Architecture
- `src/game.ts` is the single source of gameplay truth.
- Fixed-step simulation (`1/60`) updates balloons, darts, collisions, scoring, wave progression, and speed-round state.
- `src/render.ts` is a pure renderer from `GameState` -> canvas draw calls.
- `src/input.ts` maps pointer/keyboard events into game actions.
- `src/main.ts` owns loop orchestration, hook exposure, and lifecycle wiring.

## Core Data Flow
1. `main.ts` creates initial seeded `GameState`.
2. Input calls `fireDartAt`, `togglePause`, and restart helpers.
3. `updateGame` applies deterministic transitions:
- spawn balloons
- scripted deterministic darts (if `?scripted_demo=1`)
- move darts/balloons
- resolve collisions and scoring
- manage speed-round windows
- advance waves or trigger game over
4. `renderGame` paints current state each frame.
5. `renderGameToText` serializes a stable JSON snapshot for automation.

## Determinism Contract
- Seed: `2026-02-20-bloons-speed-rounds`
- RNG: FNV-hash seeded PRNG via `seededRandom`.
- Time stepping:
- Runtime loop uses fixed simulation increments.
- `window.advanceTime(ms)` forwards deterministic fixed-step updates.
- Scripted mode (`?scripted_demo=1`) fires guided darts at fixed timestamps.

## Public Interfaces
- `window.advanceTime(ms: number): void`
- `window.render_game_to_text(): string`

`GameSnapshot` keys:
- `mode`, `score`, `lives`, `wave`, `elapsedMs`, `speedRoundActive`, `speedRoundEndsInMs`, `balloonsAlive`, `dartsAlive`, `poppedTotal`, `seed`, `pendingEvents`

## Twist Implementation
- Speed round interval: every 20,000ms.
- Duration: 8,000ms.
- Multipliers while active:
- Balloon speed: `1.75x`
- Score per pop: `2x`
- HUD switches to an orange speed-round banner with countdown.

## Failure Modes and Handling
- Missing canvas context throws immediately.
- Invalid input coordinates are ignored.
- Simulation ignores non-positive `advanceTime` calls.
- Darts are culled by TTL and bounds.
- Blocked/failed automation paths are handled by report + state updates (outside game runtime).

## Verification Strategy
- `pnpm test` runs static self-check assertions against required hooks and speed-round logic presence.
- `pnpm build` validates type-safe production bundle.
- Playwright capture script emits screenshot and state artifacts proving:
- scoring increases in deterministic scripted mode
- speed-round activation and countdown visibility
