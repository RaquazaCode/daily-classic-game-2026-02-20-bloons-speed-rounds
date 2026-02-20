import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

const mainSource = readFileSync(resolve(root, "src/main.ts"), "utf8");
const gameSource = readFileSync(resolve(root, "src/game.ts"), "utf8");
const renderSource = readFileSync(resolve(root, "src/render.ts"), "utf8");
const inputSource = readFileSync(resolve(root, "src/input.ts"), "utf8");
const mapsSource = readFileSync(resolve(root, "src/data/maps.ts"), "utf8");
const menuSource = readFileSync(resolve(root, "src/ui/menu.ts"), "utf8");
const towersSource = readFileSync(resolve(root, "src/data/towers.ts"), "utf8");
const wavesSource = readFileSync(resolve(root, "src/data/waves.ts"), "utf8");
const towerSystemSource = readFileSync(resolve(root, "src/systems/towers.ts"), "utf8");
const waveSystemSource = readFileSync(resolve(root, "src/systems/waves.ts"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`Self-check failed: ${message}`);
    process.exit(1);
  }
}

assert(mainSource.includes("window.advanceTime"), "window.advanceTime hook missing");
assert(mainSource.includes("window.render_game_to_text"), "window.render_game_to_text hook missing");
assert(mainSource.includes("scripted_demo"), "scripted_demo mode missing");
assert(mainSource.includes("localStorage"), "course selection persistence missing");
assert(mainSource.includes("placingTowerType"), "tower placement key flow missing");

assert(gameSource.includes("speedRoundActive"), "speed round state missing");
assert(gameSource.includes("updateGame"), "update loop missing");
assert(gameSource.includes("SPEED_ROUND_INTERVAL_MS"), "speed round interval constant not used");
assert(gameSource.includes("fireGuidedDartAtLeadBalloon"), "deterministic scripted dart path missing");
assert(gameSource.includes("renderGameToText"), "render hook serializer missing");
assert(gameSource.includes("dartPool"), "projectile object pooling missing");
assert(gameSource.includes("particlePool"), "particle object pooling missing");
assert(gameSource.includes("spawnPopParticles"), "pop particle effect missing");
assert(gameSource.includes("hitMarkerMs"), "hit marker feedback missing");
assert(gameSource.includes("screen"), "screen state machine missing");
assert(gameSource.includes("selectedMapId"), "selected map state missing");
assert(gameSource.includes("selectedDifficulty"), "difficulty state missing");
assert(gameSource.includes("coins"), "economy coin state missing");
assert(gameSource.includes("towers"), "tower state missing");
assert(gameSource.includes("wavePlan"), "wave plan state missing");
assert(gameSource.includes("spawnTowerProjectiles"), "tower projectile firing missing");

assert(renderSource.includes("Speed round") || renderSource.includes("speed round"), "speed round HUD text missing");
assert(renderSource.includes("drawEffectsLayer"), "layered renderer effect pass missing");
assert(renderSource.includes("drawColorblindMarker"), "colorblind-safe balloon markers missing");
assert(renderSource.includes("drawMapSelectScreen"), "map select screen rendering missing");
assert(renderSource.includes("drawDifficultySelectScreen"), "difficulty select rendering missing");
assert(renderSource.includes("drawTowerShop"), "tower shop rendering missing");
assert(inputSource.includes("isStartButtonHit"), "start button targeting missing");
assert(mapsSource.includes("MAP_DEFINITIONS"), "map definitions missing");
assert(menuSource.includes("hitMapCard"), "map selection hit-test missing");
assert(menuSource.includes("hitDifficultyButton"), "difficulty selection hit-test missing");
assert(towersSource.includes("TOWER_DEFINITIONS"), "tower catalog missing");
assert(wavesSource.includes("BALLOON_DEFINITIONS"), "balloon definitions missing");
assert(waveSystemSource.includes("buildWavePlan"), "wave plan builder missing");
assert(towerSystemSource.includes("canPlaceTower"), "tower placement rule helper missing");

console.log("Self-check passed: deterministic loop, hooks, speed rounds, and scripted path are present.");
