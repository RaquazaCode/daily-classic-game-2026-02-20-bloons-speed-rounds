# Bloons Overhaul Implementation Plan (Executed)

## Goal
Upgrade the baseline Bloons speed-round run into a multi-screen tower defense experience with map selection, progression economy, and multi-tower combat while preserving deterministic automation hooks.

## Milestones

### Milestone 1 - Theme + Responsiveness Foundation
- Refactor rendering into layered passes.
- Add pop particles, muzzle flashes, hit marker pulses, and score ticks.
- Introduce projectile and particle object pools.
- Add colorblind-safe balloon marker symbols.

### Milestone 2 - Menu + Course Select + Difficulty
- Add title -> map select -> difficulty select flow.
- Add three course path definitions with route-specific spawn modifiers.
- Persist selected map and difficulty in local storage.
- Extend game text snapshot with screen and selected map state.

### Milestone 3 - Tower Progression + Economy + Wave Scaling
- Add tower catalog, unlock-gating, placement flow, and upgrades.
- Add wave planner and balloon tier definitions (health/resistance/reward).
- Add coins and wave completion bonuses.
- Add tower shop HUD and hotkeys for rapid placement.

## Verification
- `pnpm test`
- `pnpm build`
- `WEB_GAME_URL="http://127.0.0.1:4173/?scripted_demo=1" node scripts/capture_playwright.mjs`

## Contract Preservation
- Browser hooks unchanged:
- `window.advanceTime(ms)`
- `window.render_game_to_text()`
- Deterministic simulation preserved via fixed-step loop + seeded RNG.
