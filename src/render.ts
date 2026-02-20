import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GAME_TITLE,
  PATH_POINTS,
  SPEED_ROUND_SCORE_MULTIPLIER,
  START_BUTTON,
  TOWER_POSITION,
} from "./constants";
import type { GameState, Vec2 } from "./types";

function drawBackdrop(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#16384f");
  gradient.addColorStop(0.55, "#0b2234");
  gradient.addColorStop(1, "#06111c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 90; i += 1) {
    const x = ((i * 83) % CANVAS_WIDTH) + 0.5;
    const y = ((i * 47) % CANVAS_HEIGHT) + 0.5;
    ctx.fillStyle = "#9ce3ff";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawPath(ctx: CanvasRenderingContext2D): void {
  ctx.lineWidth = 38;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(254, 233, 154, 0.25)";
  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (const point of PATH_POINTS.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255, 246, 192, 0.85)";
  ctx.beginPath();
  ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
  for (const point of PATH_POINTS.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
}

function drawTower(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(TOWER_POSITION.x, TOWER_POSITION.y);

  ctx.fillStyle = "#1f2d3f";
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7d14b";
  ctx.beginPath();
  ctx.arc(0, -8, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#324a63";
  ctx.fillRect(-8, -44, 16, 34);
  ctx.restore();
}

function drawBalloons(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const balloon of state.balloons) {
    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(14, 20, 27, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "rgba(31, 40, 52, 0.55)";
    ctx.moveTo(balloon.x, balloon.y + balloon.radius);
    ctx.lineTo(balloon.x, balloon.y + balloon.radius + 11);
    ctx.stroke();
  }
}

function drawDarts(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = "#eaf6ff";
  for (const dart of state.darts) {
    ctx.beginPath();
    ctx.arc(dart.x, dart.y, dart.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHudPanel(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number): void {
  ctx.fillStyle = "rgba(5, 16, 27, 0.65)";
  ctx.fillRect(x, y, 178, 56);

  ctx.strokeStyle = "rgba(125, 198, 239, 0.48)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 178, 56);

  ctx.fillStyle = "#94d8ff";
  ctx.font = "600 15px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(label, x + 12, y + 22);

  ctx.fillStyle = "#fff7c9";
  ctx.font = "700 20px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(value, x + 12, y + 44);
}

function drawHeader(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(6, 19, 31, 0.72)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, 74);

  ctx.fillStyle = "#f7d14b";
  ctx.font = "700 30px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(GAME_TITLE, CANVAS_WIDTH / 2, 46);
  ctx.textAlign = "left";
}

function drawButton(ctx: CanvasRenderingContext2D, label: string, center: Vec2): void {
  ctx.fillStyle = "#f7d14b";
  ctx.fillRect(center.x - 160, center.y - 34, 320, 68);
  ctx.strokeStyle = "#fff6c5";
  ctx.lineWidth = 2;
  ctx.strokeRect(center.x - 160, center.y - 34, 320, 68);

  ctx.fillStyle = "#142235";
  ctx.textAlign = "center";
  ctx.font = "700 28px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(label, center.x, center.y + 10);
  ctx.textAlign = "left";
}

function drawTitleOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(4, 11, 20, 0.75)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#fff7c9";
  ctx.font = "700 52px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Speed-Rounds Challenge", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 38);

  ctx.font = "600 24px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#9fdfff";
  ctx.fillText("Pop balloon waves. Every 20 seconds, speed rounds go wild.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 14);

  drawButton(ctx, "Start Game", { x: START_BUTTON.x + START_BUTTON.width / 2, y: START_BUTTON.y + START_BUTTON.height / 2 });
  ctx.textAlign = "left";
}

function drawPausedOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(4, 11, 20, 0.62)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff7c9";
  ctx.font = "700 64px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Paused", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = "#9fdfff";
  ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Press P to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 48);
  ctx.textAlign = "left";
}

function drawGameOverOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = "rgba(10, 7, 15, 0.75)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd15c";
  ctx.font = "700 58px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Round Lost", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(`Final Score ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  drawButton(ctx, "Restart", { x: START_BUTTON.x + START_BUTTON.width / 2, y: START_BUTTON.y + START_BUTTON.height / 2 });
  ctx.textAlign = "left";
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawBackdrop(ctx);
  drawPath(ctx);
  drawTower(ctx);
  drawBalloons(ctx, state);
  drawDarts(ctx, state);
  drawHeader(ctx);

  drawHudPanel(ctx, "Score", String(state.score), 20, 86);
  drawHudPanel(ctx, "Lives", String(state.lives), 214, 86);
  drawHudPanel(ctx, "Wave", String(state.wave), 408, 86);
  drawHudPanel(ctx, "Popped", String(state.poppedTotal), 602, 86);

  if (state.speedRoundActive) {
    ctx.fillStyle = "rgba(252, 120, 67, 0.78)";
    ctx.fillRect(796, 90, 466, 48);
    ctx.fillStyle = "#fffbde";
    ctx.font = "700 24px 'Barlow', 'Trebuchet MS', sans-serif";
    const endsIn = Math.max(0, Math.ceil((state.speedRoundEndsAtMs - state.elapsedMs) / 1000));
    ctx.fillText(`SPEED ROUND x${SPEED_ROUND_SCORE_MULTIPLIER} SCORE • ${endsIn}s`, 814, 121);
  } else {
    ctx.fillStyle = "rgba(13, 31, 48, 0.74)";
    ctx.fillRect(796, 90, 466, 48);
    ctx.fillStyle = "#9fdfff";
    ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
    const startsIn = Math.max(0, Math.ceil((state.nextSpeedRoundAtMs - state.elapsedMs) / 1000));
    ctx.fillText(`Next speed round in ${startsIn}s`, 816, 121);
  }

  ctx.fillStyle = "#d8f0ff";
  ctx.font = "600 18px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Controls: Click to shoot • P pause • R restart • F fullscreen", 22, CANVAS_HEIGHT - 20);

  if (state.mode === "title") {
    drawTitleOverlay(ctx);
  } else if (state.mode === "paused") {
    drawPausedOverlay(ctx);
  } else if (state.mode === "game_over") {
    drawGameOverOverlay(ctx, state);
  }
}
