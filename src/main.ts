import "./style.css";
import { CANVAS_HEIGHT, CANVAS_WIDTH, FIXED_STEP_MS, GAME_SEED } from "./constants";
import { DEFAULT_MAP_ID, MAP_DEFINITIONS } from "./data/maps";
import { bindInput, isStartButtonHit } from "./input";
import {
  createInitialState,
  fireDartAt,
  goToMapSelect,
  renderGameToText,
  resetToTitle,
  selectDifficulty,
  selectMap,
  setPlacingTowerType,
  startPlaying,
  togglePause,
  tryPlaceTower,
  tryUpgradeTowerAt,
  updateGame,
} from "./game";
import { renderGame } from "./render";
import { DIFFICULTY_OPTIONS, hitDifficultyButton, hitMapCard } from "./ui/menu";
import type { DifficultyChoice, GameState, TowerTypeId } from "./types";

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
  }
}

const STORAGE_KEY_MAP = "daily-classic-game:selected-map";
const STORAGE_KEY_DIFFICULTY = "daily-classic-game:selected-difficulty";

const HOTKEY_TOWER: Record<string, TowerTypeId> = {
  "1": "dart_monkey",
  "2": "tack_sprayer",
  "3": "ice_tower",
  "4": "sniper",
};

function readPersistedMapId(): string {
  const fallback = DEFAULT_MAP_ID;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY_MAP);
    if (value && MAP_DEFINITIONS.some((map) => map.id === value)) {
      return value;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function readPersistedDifficulty(): DifficultyChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY_DIFFICULTY);
    if (value && DIFFICULTY_OPTIONS.includes(value as DifficultyChoice)) {
      return value as DifficultyChoice;
    }
  } catch {
    return "medium";
  }
  return "medium";
}

function persistSelection(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_MAP, state.selectedMapId);
    window.localStorage.setItem(STORAGE_KEY_DIFFICULTY, state.selectedDifficulty);
  } catch {
    // Local storage failures should not block gameplay.
  }
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app container missing");
}

const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.className = "game-canvas";
app.appendChild(canvas);

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("2D context unavailable");
}
const ctx: CanvasRenderingContext2D = context;

const query = new URLSearchParams(window.location.search);
const scriptedDemo = query.get("scripted_demo") === "1";

let state: GameState = createInitialState(
  GAME_SEED,
  scriptedDemo,
  readPersistedMapId(),
  readPersistedDifficulty(),
);
if (scriptedDemo) {
  startPlaying(state);
}

function rebuildStateToTitle(): void {
  state = createInitialState(state.seed, state.scriptedDemo, state.selectedMapId, state.selectedDifficulty);
  resetToTitle(state);
}

function handlePointerDown(x: number, y: number): void {
  if (state.screen === "title") {
    if (isStartButtonHit(x, y)) {
      goToMapSelect(state);
    }
    return;
  }

  if (state.screen === "map_select") {
    const selectedMapId = hitMapCard(x, y);
    if (selectedMapId) {
      selectMap(state, selectedMapId);
      persistSelection(state);
    }
    return;
  }

  if (state.screen === "difficulty_select") {
    const difficulty = hitDifficultyButton(x, y);
    if (difficulty) {
      selectDifficulty(state, difficulty);
      persistSelection(state);
      startPlaying(state);
    }
    return;
  }

  if (state.screen === "game_over") {
    if (isStartButtonHit(x, y)) {
      rebuildStateToTitle();
      goToMapSelect(state);
    }
    return;
  }

  if (state.screen === "playing") {
    if (state.placingTowerType) {
      void tryPlaceTower(state, x, y);
      return;
    }

    if (tryUpgradeTowerAt(state, x, y)) {
      return;
    }

    fireDartAt(state, x, y, null);
  }
}

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    void canvas.requestFullscreen().catch(() => undefined);
    return;
  }
  void document.exitFullscreen();
}

function handleKeyDown(key: string): void {
  if (key === "p") {
    togglePause(state);
    return;
  }

  if (key === "r") {
    rebuildStateToTitle();
    return;
  }

  if (key === "f") {
    toggleFullscreen();
    return;
  }

  if (key === "escape") {
    if (state.screen === "playing" && state.placingTowerType) {
      setPlacingTowerType(state, null);
      return;
    }
    rebuildStateToTitle();
    return;
  }

  if (key === "0") {
    setPlacingTowerType(state, null);
    return;
  }

  if (key in HOTKEY_TOWER) {
    if (state.screen === "playing") {
      setPlacingTowerType(state, HOTKEY_TOWER[key]);
    }
    return;
  }

  if (key === "enter") {
    if (state.screen === "title") {
      goToMapSelect(state);
    } else if (state.screen === "difficulty_select") {
      startPlaying(state);
    }
  }
}

const unbindInput = bindInput(canvas, {
  onPointerDown: handlePointerDown,
  onKeyDown: handleKeyDown,
});

let previousTime = performance.now();
let accumulatorMs = 0;

function stepSimulation(ms: number): void {
  const steps = Math.max(1, Math.round(ms / FIXED_STEP_MS));
  for (let index = 0; index < steps; index += 1) {
    updateGame(state, FIXED_STEP_MS);
  }
}

function frame(now: number): void {
  const deltaMs = Math.min(64, now - previousTime);
  previousTime = now;
  accumulatorMs += deltaMs;

  while (accumulatorMs >= FIXED_STEP_MS) {
    updateGame(state, FIXED_STEP_MS);
    accumulatorMs -= FIXED_STEP_MS;
  }

  renderGame(ctx, state);
  window.requestAnimationFrame(frame);
}

window.advanceTime = (ms: number): void => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return;
  }
  stepSimulation(ms);
  renderGame(ctx, state);
};

window.render_game_to_text = (): string => renderGameToText(state);

window.addEventListener("beforeunload", () => {
  unbindInput();
});

renderGame(ctx, state);
window.requestAnimationFrame(frame);
