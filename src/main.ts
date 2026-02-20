import "./style.css";
import { CANVAS_HEIGHT, CANVAS_WIDTH, FIXED_STEP_MS, GAME_SEED } from "./constants";
import { bindInput, isStartButtonHit } from "./input";
import { createInitialState, fireDartAt, renderGameToText, resetToTitle, startPlaying, togglePause, updateGame } from "./game";
import { renderGame } from "./render";
import type { GameState } from "./types";

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
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

let state: GameState = createInitialState(GAME_SEED, scriptedDemo);
if (scriptedDemo) {
  startPlaying(state);
}

function restartToTitle(): void {
  state = resetToTitle(state.seed, state.scriptedDemo);
  if (scriptedDemo) {
    startPlaying(state);
  }
}

function handlePointerDown(x: number, y: number): void {
  if (state.mode === "title") {
    if (isStartButtonHit(x, y)) {
      startPlaying(state);
    }
    return;
  }

  if (state.mode === "game_over") {
    if (isStartButtonHit(x, y)) {
      restartToTitle();
      startPlaying(state);
    }
    return;
  }

  if (state.mode === "playing") {
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
    restartToTitle();
    return;
  }

  if (key === "f") {
    toggleFullscreen();
    return;
  }

  if (key === "enter" && state.mode === "title") {
    startPlaying(state);
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
