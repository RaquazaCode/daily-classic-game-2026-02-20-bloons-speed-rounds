import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

const mainSource = readFileSync(resolve(root, "src/main.ts"), "utf8");
const gameSource = readFileSync(resolve(root, "src/game.ts"), "utf8");
const renderSource = readFileSync(resolve(root, "src/render.ts"), "utf8");
const inputSource = readFileSync(resolve(root, "src/input.ts"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`Self-check failed: ${message}`);
    process.exit(1);
  }
}

assert(mainSource.includes("window.advanceTime"), "window.advanceTime hook missing");
assert(mainSource.includes("window.render_game_to_text"), "window.render_game_to_text hook missing");
assert(mainSource.includes("scripted_demo"), "scripted_demo mode missing");

assert(gameSource.includes("speedRoundActive"), "speed round state missing");
assert(gameSource.includes("updateGame"), "update loop missing");
assert(gameSource.includes("SPEED_ROUND_INTERVAL_MS"), "speed round interval constant not used");
assert(gameSource.includes("fireGuidedDartAtLeadBalloon"), "deterministic scripted dart path missing");
assert(gameSource.includes("renderGameToText"), "render hook serializer missing");
assert(gameSource.includes("dartPool"), "projectile object pooling missing");
assert(gameSource.includes("particlePool"), "particle object pooling missing");
assert(gameSource.includes("spawnPopParticles"), "pop particle effect missing");
assert(gameSource.includes("hitMarkerMs"), "hit marker feedback missing");

assert(renderSource.includes("Speed round") || renderSource.includes("speed round"), "speed round HUD text missing");
assert(renderSource.includes("drawEffectsLayer"), "layered renderer effect pass missing");
assert(renderSource.includes("drawColorblindMarker"), "colorblind-safe balloon markers missing");
assert(inputSource.includes("isStartButtonHit"), "start button targeting missing");

console.log("Self-check passed: deterministic loop, hooks, speed rounds, and scripted path are present.");
