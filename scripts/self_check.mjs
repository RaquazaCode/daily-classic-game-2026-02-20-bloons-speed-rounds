import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const mainSource = readFileSync(resolve(root, "src/main.ts"), "utf8");
const gameSource = readFileSync(resolve(root, "src/game.ts"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`Self-check failed: ${message}`);
    process.exit(1);
  }
}

assert(mainSource.includes("window.advanceTime"), "window.advanceTime hook missing");
assert(mainSource.includes("window.render_game_to_text"), "window.render_game_to_text hook missing");
assert(gameSource.includes("speedRoundActive"), "speed round state missing");
assert(gameSource.includes("updateGame"), "update loop missing");

console.log("Self-check passed.");
