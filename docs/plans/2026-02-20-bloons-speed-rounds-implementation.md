# 2026-02-20 Bloons Speed-Rounds Implementation Plan

## Goal
Ship one unattended-safe daily game run for `bloons` with the `speed rounds` twist, new standalone local folder, new standalone GitHub repo, deterministic hooks, verification artifacts, and automation record updates.

## Locked Inputs
- Root: `/Users/testaccountforsystem-wideissues/.codex/automations/daily-classic-game`
- Game id: `bloons`
- Date slug: `2026-02-20-bloons-speed-rounds`
- Local run folder: `games/2026-02-20-bloons-speed-rounds/`
- GitHub repo: `daily-classic-game-2026-02-20-bloons-speed-rounds`

## Scope
- Implement deterministic playable MVP with:
- title/start, gameplay, pause, restart
- collision/rules/scoring/lives/wave progression
- speed-round twist
- Expose browser hooks:
- `window.advanceTime(ms)`
- `window.render_game_to_text()`
- Produce verification evidence:
- self-check + build + Playwright screenshots/state JSON + GIF captures
- Perform repo workflow:
- first commit -> immediate repo create -> feature branch PR -> merge commit -> hardening
- Update automation records and queue/catalog.

## Deliverables
- `README.md`, `design.md`, `progress.md`
- `src/`, `assets/`, `scripts/`, `docs/plans/`, `playwright/`
- `package.json`, `tsconfig.json`, `playwright_actions.json`
- Automation updates in `.automation/`, `data/`, and `INDEX.md`.

## Acceptance Criteria
- New folder/repo created (not reused).
- Deterministic gameplay and hooks work.
- Verification commands pass.
- Playwright state shows scoring and speed-round activation.
- PR merged with merge commit (no squash).
- Hardening script run successfully.
- Catalog/state/queue/index/report updated for this run.
