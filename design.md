# Bloons Speed Rounds - Design

## Goal
Ship a deterministic Bloons-inspired browser game with menu-driven map selection, difficulty scaling, tower progression, and speed-round spikes that remain automation-safe.

## Architecture
- `src/game.ts` is the simulation authority and state machine.
- `src/render.ts` handles layered canvas rendering (background, path, entities, effects, HUD, overlays).
- `src/data/` holds static catalogs:
- `maps.ts` for course geometry/modifiers.
- `towers.ts` for tower stats, unlocks, and upgrades.
- `waves.ts` for balloon definitions and preset wave seeds.
- `src/systems/` holds reusable gameplay systems:
- `towers.ts` for placement/targeting/upgrade rules.
- `waves.ts` for wave plan generation and completion rewards.
- `src/main.ts` wires input, persisted selections, and browser hook exposure.

## Gameplay State Model
- Screen flow:
- `title -> map_select -> difficulty_select -> playing`
- Side states:
- `paused`, `game_over`
- Deterministic runtime data includes:
- selected map + difficulty
- coins economy
- tower roster and upgrade levels
- wave spawn plan and spawn cursor
- balloon tier/health/resistance

## Determinism Contract
- Seeded PRNG: FNV-derived generator in `src/rng.ts`.
- Fixed-step simulation: `1/60` updates.
- Automation hooks (stable signatures):
- `window.advanceTime(ms)`
- `window.render_game_to_text()`
- Scripted verification path: `?scripted_demo=1`.

## Public Snapshot Contract
`render_game_to_text()` returns stable JSON with keys:
- `mode`, `screen`, `score`, `coins`, `lives`, `wave`, `selectedMapId`, `elapsedMs`, `speedRoundActive`, `speedRoundEndsInMs`, `balloonsAlive`, `towersPlaced`, `projectilesAlive`, `poppedTotal`, `seed`, `pendingEvents`.

## Progression Design
- Tower hotkeys: `1` Dart Monkey, `2` Tack Sprayer, `3` Ice Tower, `4` Sniper.
- Unlocks are wave-gated.
- Coins come from pops + wave completion bonus.
- Towers support two upgrade tiers.
- Balloon tiers scale in composition and durability as waves progress.

## Twist Implementation
- Speed round interval: every 20,000ms.
- Active window: 8,000ms.
- Multipliers:
- Balloon speed `1.75x`.
- Score `2x`.

## Verification Strategy
- `pnpm test` checks required hook and feature contracts.
- `pnpm build` validates type-safe production build.
- Playwright capture artifacts validate deterministic score/tower/wave transitions.
