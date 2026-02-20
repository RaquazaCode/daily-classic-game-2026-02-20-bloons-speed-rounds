import { CANVAS_HEIGHT, CANVAS_WIDTH, GAME_TITLE, SPEED_ROUND_SCORE_MULTIPLIER, START_BUTTON, TOWER_POSITION } from "./constants";
import { TOWER_DEFINITIONS, TOWER_ORDER, towerUnlockedByWave } from "./data/towers";
import { DIFFICULTY_OPTIONS, difficultyButtonRect, mapCardRect } from "./ui/menu";
import { MAP_DEFINITIONS } from "./data/maps";
import type { Balloon, GameState, TowerTypeId, Vec2 } from "./types";

const TOWER_COLORS: Record<TowerTypeId, string> = {
  dart_monkey: "#f3d36e",
  tack_sprayer: "#ffb07e",
  ice_tower: "#9fe8ff",
  sniper: "#dce7ff",
};

function drawBackgroundLayer(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  sky.addColorStop(0, "#0b2f30");
  sky.addColorStop(0.35, "#0f473c");
  sky.addColorStop(1, "#1a5a3b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const fog = ctx.createRadialGradient(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.1, 20, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.1, 520);
  fog.addColorStop(0, "rgba(255, 238, 176, 0.18)");
  fog.addColorStop(1, "rgba(255, 238, 176, 0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 120; i += 1) {
    const x = ((i * 109) % CANVAS_WIDTH) + 0.5;
    const y = ((i * 71) % CANVAS_HEIGHT) + 0.5;
    ctx.fillStyle = i % 3 === 0 ? "#a0f9a8" : "#d7ffc8";
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(5, 22, 17, 0.6)";
  for (let i = 0; i < 16; i += 1) {
    const x = i * 88 - 10;
    const h = 120 + (i % 4) * 34;
    ctx.beginPath();
    ctx.moveTo(x, CANVAS_HEIGHT + 8);
    ctx.quadraticCurveTo(x + 26, CANVAS_HEIGHT - h, x + 54, CANVAS_HEIGHT + 8);
    ctx.fill();
  }
}

function drawPathLayer(ctx: CanvasRenderingContext2D, pathPoints: Vec2[]): void {
  if (pathPoints.length < 2) {
    return;
  }

  ctx.lineCap = "round";
  ctx.lineWidth = 42;
  ctx.strokeStyle = "rgba(65, 90, 58, 0.58)";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  const lane = ctx.createLinearGradient(pathPoints[0].x, pathPoints[0].y, pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
  lane.addColorStop(0, "#f5d68f");
  lane.addColorStop(1, "#d4b06a");
  ctx.lineWidth = 20;
  ctx.strokeStyle = lane;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.setLineDash([11, 12]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(80, 53, 19, 0.42)";
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (const point of pathPoints.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBaseTower(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.save();
  ctx.translate(TOWER_POSITION.x, TOWER_POSITION.y);

  ctx.fillStyle = "#122744";
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f2d051";
  ctx.beginPath();
  ctx.arc(0, -11, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#335775";
  ctx.fillRect(-10, -52, 20, 40);

  if (state.muzzleFlashMs > 0) {
    const alpha = state.muzzleFlashMs / 120;
    ctx.fillStyle = `rgba(255, 246, 173, ${0.45 * alpha})`;
    ctx.beginPath();
    ctx.arc(0, -46, 30 * alpha + 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlacedTowers(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const tower of state.towers) {
    ctx.save();
    ctx.translate(tower.x, tower.y);

    const fill = TOWER_COLORS[tower.typeId];
    ctx.fillStyle = "#122744";
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, -6, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.font = "700 12px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`L${tower.level}`, 0, 21);
    ctx.textAlign = "left";

    ctx.restore();
  }

  if (state.placingTowerType) {
    const sample = state.towers.find((tower) => tower.typeId === state.placingTowerType);
    const fallbackRange = sample?.range ?? TOWER_DEFINITIONS[state.placingTowerType].range;
    ctx.strokeStyle = "rgba(172, 245, 204, 0.32)";
    ctx.lineWidth = 2;
    for (const tower of state.towers) {
      if (tower.typeId !== state.placingTowerType) {
        continue;
      }
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(172, 245, 204, 0.75)";
    ctx.font = "600 15px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.fillText(`Placing ${TOWER_DEFINITIONS[state.placingTowerType].name} • range ${Math.round(fallbackRange)}`, 24, CANVAS_HEIGHT - 44);
  }
}

function drawColorblindMarker(ctx: CanvasRenderingContext2D, balloon: Balloon): void {
  ctx.save();
  ctx.translate(balloon.x, balloon.y);
  ctx.strokeStyle = "rgba(5, 20, 29, 0.7)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = 2;

  if (balloon.marker === "dot") {
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (balloon.marker === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (balloon.marker === "stripe") {
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(7, 6);
    ctx.moveTo(-7, -1);
    ctx.lineTo(7, 11);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBalloonsLayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const balloon of state.balloons) {
    ctx.fillStyle = balloon.color;
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(16, 28, 34, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    drawColorblindMarker(ctx, balloon);

    const healthWidth = 24;
    const healthPct = Math.max(0, balloon.health / balloon.maxHealth);
    ctx.fillStyle = "rgba(10, 18, 22, 0.65)";
    ctx.fillRect(balloon.x - healthWidth / 2, balloon.y - balloon.radius - 11, healthWidth, 4);
    ctx.fillStyle = "#8dffb6";
    ctx.fillRect(balloon.x - healthWidth / 2, balloon.y - balloon.radius - 11, healthWidth * healthPct, 4);

    ctx.beginPath();
    ctx.strokeStyle = "rgba(17, 39, 44, 0.55)";
    ctx.moveTo(balloon.x, balloon.y + balloon.radius);
    ctx.lineTo(balloon.x, balloon.y + balloon.radius + 11);
    ctx.stroke();
  }
}

function drawProjectilesLayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const dart of state.darts) {
    ctx.fillStyle = dart.color;
    ctx.beginPath();
    ctx.arc(dart.x, dart.y, dart.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEffectsLayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const particle of state.particles) {
    const alpha = Math.max(0.12, Math.min(1, particle.ttlMs / 260));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (state.hitMarkerMs > 0) {
    const scale = 1 + (1 - state.hitMarkerMs / 180) * 0.6;
    const alpha = state.hitMarkerMs / 180;
    ctx.save();
    ctx.translate(state.hitMarkerX, state.hitMarkerY);
    ctx.strokeStyle = `rgba(255, 245, 193, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (state.scoreTickMs > 0 && state.scoreTickValue > 0) {
    const progress = 1 - state.scoreTickMs / 560;
    const yOffset = progress * 32;
    ctx.fillStyle = "rgba(255, 251, 212, 0.95)";
    ctx.font = "700 28px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.fillText(`+${state.scoreTickValue}`, state.hitMarkerX + 18, state.hitMarkerY - 16 - yOffset);
  }
}

function drawHudPanel(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number): void {
  ctx.fillStyle = "rgba(7, 27, 31, 0.72)";
  ctx.fillRect(x, y, 178, 56);

  ctx.strokeStyle = "rgba(143, 227, 188, 0.54)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 178, 56);

  ctx.fillStyle = "#9df7ca";
  ctx.font = "600 15px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(label, x + 12, y + 22);

  ctx.fillStyle = "#fff7d1";
  ctx.font = "700 20px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(value, x + 12, y + 44);
}

function drawHeaderLayer(ctx: CanvasRenderingContext2D, subtitle: string): void {
  const headerGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
  headerGradient.addColorStop(0, "rgba(8, 33, 33, 0.88)");
  headerGradient.addColorStop(1, "rgba(17, 59, 46, 0.88)");
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 74);

  ctx.fillStyle = "#ffd565";
  ctx.font = "700 30px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${GAME_TITLE} • Neo Jungle`, CANVAS_WIDTH / 2, 44);

  ctx.fillStyle = "#9ee6c6";
  ctx.font = "600 17px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, 64);
  ctx.textAlign = "left";
}

function drawButton(ctx: CanvasRenderingContext2D, label: string, center: Vec2): void {
  ctx.fillStyle = "#f3d46d";
  ctx.fillRect(center.x - 160, center.y - 34, 320, 68);
  ctx.strokeStyle = "#fff7cb";
  ctx.lineWidth = 2;
  ctx.strokeRect(center.x - 160, center.y - 34, 320, 68);

  ctx.fillStyle = "#1a2f27";
  ctx.textAlign = "center";
  ctx.font = "700 28px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(label, center.x, center.y + 10);
  ctx.textAlign = "left";
}

function drawTitleScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(6, 18, 15, 0.78)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#fff6cc";
  ctx.font = "700 52px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Speed-Rounds Jungle", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 44);

  ctx.font = "600 23px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillStyle = "#aceac9";
  ctx.fillText("Three courses. Dynamic difficulty. Tower progression.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 6);

  drawButton(ctx, "Select Course", { x: START_BUTTON.x + START_BUTTON.width / 2, y: START_BUTTON.y + START_BUTTON.height / 2 });
  ctx.textAlign = "left";
}

function drawMapSelectScreen(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = "rgba(4, 16, 14, 0.8)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6cc";
  ctx.font = "700 44px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Choose Course", CANVAS_WIDTH / 2, 172);

  ctx.fillStyle = "#a6eacc";
  ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Easy, medium, and hard route geometry.", CANVAS_WIDTH / 2, 208);

  MAP_DEFINITIONS.forEach((map, index) => {
    const rect = mapCardRect(index);
    const isSelected = state.selectedMapId === map.id;
    ctx.fillStyle = isSelected ? "rgba(48, 133, 104, 0.9)" : "rgba(10, 38, 33, 0.9)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = isSelected ? "#d6ffbb" : "rgba(149, 237, 191, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = "#ffe18e";
    ctx.font = "700 24px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(map.name, rect.x + 14, rect.y + 36);

    ctx.fillStyle = "#c6f8df";
    ctx.font = "600 17px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.fillText(map.summary, rect.x + 14, rect.y + 68);

    ctx.fillStyle = "#f7f1cf";
    ctx.font = "700 16px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.fillText(`Default: ${map.difficulty.toUpperCase()}`, rect.x + 14, rect.y + 98);
    ctx.fillText("Click to continue", rect.x + 14, rect.y + 130);
  });

  ctx.textAlign = "left";
}

function drawDifficultySelectScreen(ctx: CanvasRenderingContext2D, state: GameState): void {
  const selectedMap = MAP_DEFINITIONS.find((map) => map.id === state.selectedMapId) ?? MAP_DEFINITIONS[0];

  ctx.fillStyle = "rgba(3, 15, 13, 0.8)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6cc";
  ctx.font = "700 44px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Choose Difficulty", CANVAS_WIDTH / 2, 172);

  ctx.fillStyle = "#a6eacc";
  ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(`${selectedMap.name} selected • pick challenge level`, CANVAS_WIDTH / 2, 208);

  DIFFICULTY_OPTIONS.forEach((difficulty, index) => {
    const rect = difficultyButtonRect(index);
    const isSelected = difficulty === state.selectedDifficulty;
    ctx.fillStyle = isSelected ? "rgba(249, 181, 93, 0.95)" : "rgba(10, 42, 37, 0.92)";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = isSelected ? "#fff8d2" : "rgba(158, 233, 195, 0.52)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = isSelected ? "#21362a" : "#d9fce7";
    ctx.font = "700 24px 'Barlow', 'Trebuchet MS', sans-serif";
    ctx.fillText(difficulty.toUpperCase(), rect.x + rect.width / 2, rect.y + 43);
  });

  ctx.fillStyle = "#d9fce7";
  ctx.font = "600 18px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Click a difficulty to start", CANVAS_WIDTH / 2, 520);
  ctx.textAlign = "left";
}

function drawPausedOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(4, 14, 12, 0.64)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6cc";
  ctx.font = "700 64px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Paused", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = "#9ae9c0";
  ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Press P to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 48);
  ctx.textAlign = "left";
}

function drawGameOverOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = "rgba(12, 14, 16, 0.76)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd56f";
  ctx.font = "700 58px 'Bungee', 'Trebuchet MS', sans-serif";
  ctx.fillText("Round Lost", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText(`Final Score ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

  drawButton(ctx, "Restart", { x: START_BUTTON.x + START_BUTTON.width / 2, y: START_BUTTON.y + START_BUTTON.height / 2 });
  ctx.textAlign = "left";
}

function drawTowerShop(ctx: CanvasRenderingContext2D, state: GameState): void {
  const panelX = 18;
  const panelY = 510;
  const panelWidth = 360;
  const panelHeight = 186;

  ctx.fillStyle = "rgba(6, 27, 24, 0.82)";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.strokeStyle = "rgba(143, 227, 188, 0.44)";
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  ctx.fillStyle = "#c6f8df";
  ctx.font = "700 18px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Tower Shop", panelX + 12, panelY + 24);

  TOWER_ORDER.forEach((towerId, index) => {
    const def = TOWER_DEFINITIONS[towerId];
    const unlocked = towerUnlockedByWave(towerId, state.wave);
    const selected = state.placingTowerType === towerId;

    const rowY = panelY + 42 + index * 34;
    ctx.fillStyle = selected ? "rgba(238, 188, 103, 0.3)" : "rgba(255, 255, 255, 0)";
    ctx.fillRect(panelX + 8, rowY - 14, panelWidth - 16, 26);

    ctx.fillStyle = unlocked ? "#f5edc4" : "rgba(175, 194, 186, 0.75)";
    ctx.font = "600 15px 'Barlow', 'Trebuchet MS', sans-serif";
    const lockText = unlocked ? `$${def.cost}` : `Unlock W${def.unlockWave}`;
    ctx.fillText(`${index + 1}. ${def.name} • ${lockText}`, panelX + 14, rowY);
  });

  ctx.fillStyle = "#9de4c8";
  ctx.font = "600 13px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Click empty ground to place • Click tower to upgrade • 0 cancels", panelX + 12, panelY + panelHeight - 14);
}

function drawHudLayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawHudPanel(ctx, "Score", String(state.score), 20, 86);
  drawHudPanel(ctx, "Lives", String(state.lives), 214, 86);
  drawHudPanel(ctx, "Wave", String(state.wave), 408, 86);
  drawHudPanel(ctx, "Coins", String(state.coins), 602, 86);

  if (state.speedRoundActive) {
    ctx.fillStyle = "rgba(238, 129, 72, 0.86)";
    ctx.fillRect(796, 90, 466, 48);
    ctx.fillStyle = "#fffbde";
    ctx.font = "700 24px 'Barlow', 'Trebuchet MS', sans-serif";
    const endsIn = Math.max(0, Math.ceil((state.speedRoundEndsAtMs - state.elapsedMs) / 1000));
    ctx.fillText(`SPEED ROUND x${SPEED_ROUND_SCORE_MULTIPLIER} SCORE • ${endsIn}s`, 814, 121);
  } else {
    ctx.fillStyle = "rgba(8, 44, 39, 0.8)";
    ctx.fillRect(796, 90, 466, 48);
    ctx.fillStyle = "#aef0d3";
    ctx.font = "600 22px 'Barlow', 'Trebuchet MS', sans-serif";
    const startsIn = Math.max(0, Math.ceil((state.nextSpeedRoundAtMs - state.elapsedMs) / 1000));
    ctx.fillText(`Next speed round in ${startsIn}s`, 816, 121);
  }

  ctx.fillStyle = "#d8ffe9";
  ctx.font = "600 18px 'Barlow', 'Trebuchet MS', sans-serif";
  ctx.fillText("Controls: 1-4 select tower • Click place/upgrade • P pause • R restart • F fullscreen", 22, CANVAS_HEIGHT - 18);

  drawTowerShop(ctx, state);
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawBackgroundLayer(ctx);
  drawPathLayer(ctx, state.pathPoints);
  drawBaseTower(ctx, state);
  drawPlacedTowers(ctx, state);
  drawBalloonsLayer(ctx, state);
  drawProjectilesLayer(ctx, state);
  drawEffectsLayer(ctx, state);

  const selectedMap = MAP_DEFINITIONS.find((map) => map.id === state.selectedMapId) ?? MAP_DEFINITIONS[0];
  drawHeaderLayer(ctx, `${selectedMap.name} • ${state.selectedDifficulty.toUpperCase()}`);

  if (state.screen === "playing" || state.screen === "paused" || state.screen === "game_over") {
    drawHudLayer(ctx, state);
  }

  if (state.screen === "title") {
    drawTitleScreen(ctx);
  } else if (state.screen === "map_select") {
    drawMapSelectScreen(ctx, state);
  } else if (state.screen === "difficulty_select") {
    drawDifficultySelectScreen(ctx, state);
  } else if (state.screen === "paused") {
    drawPausedOverlay(ctx);
  } else if (state.screen === "game_over") {
    drawGameOverOverlay(ctx, state);
  }
}
