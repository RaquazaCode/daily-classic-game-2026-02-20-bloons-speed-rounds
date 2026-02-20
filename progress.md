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
