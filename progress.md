Original prompt: Implement the 2026-02-20 Bloons Speed-Rounds Automation Plan.

## Progress
- Scaffolded new run folder under canonical root:
- `/Users/testaccountforsystem-wideissues/.codex/automations/daily-classic-game/games/2026-02-20-bloons-speed-rounds`
- Initialized standalone git repo and created first scaffold commit.
- Created GitHub repo immediately after first commit:
- `https://github.com/RaquazaCode/daily-classic-game-2026-02-20-bloons-speed-rounds`
- Implemented deterministic gameplay core:
- fixed-step loop, seeded RNG, deterministic path, balloon spawning, dart firing, collision, wave progression, lives/game over
- Implemented twist:
- speed rounds every 20s for 8s, with speed and score multipliers
- Added automation hooks and scripted deterministic verification path:
- `window.advanceTime(ms)`
- `window.render_game_to_text()`
- `?scripted_demo=1`
- Added Playwright capture artifacts and GIF clips.

## Verification Evidence
- `pnpm test`: pass
- `pnpm build`: pass
- `WEB_GAME_URL="http://127.0.0.1:4173/?scripted_demo=1" node scripts/capture_playwright.mjs`: pass

Deterministic proof snapshots:
- `playwright/main-actions/state-2.json` -> score `30`, popped `3`
- `playwright/main-actions/state-6.json` -> speed round active, score `110`, wave `2`

## Outstanding
- Push feature branch and open PR.
- Merge PR with merge commit.
- Run post-run hardening script.
- Update automation catalog/state/queue/index/report files.

## 2026-02-20 Overhaul Milestone 1
- Branch: `codex/2026-02-20-bloons-overhaul-m1-theme`.
- Implemented Neo Jungle renderer refactor with explicit layer passes:
- background, path, tower/entities, effects, HUD, overlays.
- Added responsive combat feedback:
- muzzle flash at tower fire
- pop particle bursts
- hit marker pulse and score tick floaters
- Added object pooling to reduce runtime allocation churn:
- `dartPool` and `particlePool` in game state.
- Added colorblind-safe balloon markers:
- deterministic marker symbols (`dot`, `ring`, `stripe`, `cross`).
- Refreshed Playwright artifacts after visual/gameplay updates.

## 2026-02-20 Overhaul Milestone 2
- Branch: `codex/2026-02-20-bloons-overhaul-m2-maps`.
- Added menu state machine flow:
- `title -> map_select -> difficulty_select -> playing`.
- Added new data modules:
- `src/data/maps.ts` with 3 course definitions and spawn/reward modifiers.
- `src/ui/menu.ts` for deterministic hit-testing and menu layouts.
- Added selected course + difficulty persistence via `localStorage`.
- `render_game_to_text` now includes `screen` and `selectedMapId`.
- Runtime pathing is now map-driven (`state.pathPoints`) instead of fixed constants.

## 2026-02-20 Overhaul Milestone 3
- Branch: `codex/2026-02-20-bloons-overhaul-m3-progression`.
- Added tower-defense progression systems and data modules:
- `src/data/towers.ts`
- `src/data/waves.ts`
- `src/systems/towers.ts`
- `src/systems/waves.ts`
- Added economy + progression state:
- coins, wave bonuses, unlock-by-wave tower gating, and per-tower upgrades.
- Added 4 tower archetypes:
- Dart Monkey, Tack Sprayer, Ice Tower, Sniper.
- Added balloon tiers/resistances/health and difficulty-scaled wave plans.
- Added tower placement hotkeys (`1`-`4`) and placement cancel (`0`), plus click-upgrade behavior.
- Expanded snapshot payload with `coins`, `towersPlaced`, and `projectilesAlive`.
