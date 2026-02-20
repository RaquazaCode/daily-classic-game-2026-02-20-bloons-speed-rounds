import fs from "node:fs";
import path from "node:path";
import { chromium } from "/Users/testaccountforsystem-wideissues/.codex/skills/develop-web-game/node_modules/playwright/index.mjs";

const root = new URL("..", import.meta.url).pathname;
const actionsPath = path.join(root, "playwright_actions.json");
const outputDir = path.join(root, "playwright", "main-actions");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function readActions() {
  const raw = await fs.promises.readFile(actionsPath, "utf8");
  const payload = JSON.parse(raw);
  return payload.steps ?? [];
}

async function captureState(page, index) {
  const state = await page.evaluate(() => {
    if (typeof window.render_game_to_text === "function") {
      return window.render_game_to_text();
    }
    return null;
  });
  if (state) {
    await fs.promises.writeFile(path.join(outputDir, `state-${index}.json`), state);
  }
  await page.screenshot({ path: path.join(outputDir, `shot-${index}.png`), fullPage: true });
}

async function run() {
  const url = process.env.WEB_GAME_URL ?? "http://127.0.0.1:4173/?scripted_demo=1";
  const steps = await readActions();
  await ensureDir(outputDir);

  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ type: "console.error", text: msg.text() });
    }
  });
  page.on("pageerror", (error) => {
    errors.push({ type: "pageerror", text: String(error) });
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);

  let stepIndex = 0;
  for (const step of steps) {
    const frames = Number(step.frames ?? 0);
    if (step.mouse_x != null && step.mouse_y != null) {
      await page.mouse.move(step.mouse_x, step.mouse_y);
    }
    for (const button of step.buttons ?? []) {
      if (button === "left_mouse_button") {
        await page.mouse.down();
        await page.mouse.up();
      } else {
        await page.keyboard.press(String(button).toUpperCase());
      }
    }

    if (frames > 0) {
      await page.evaluate((ms) => {
        if (typeof window.advanceTime === "function") {
          window.advanceTime(ms);
        }
      }, Math.round((frames * 1000) / 60));
    }

    await page.waitForTimeout(60);
    await captureState(page, stepIndex);
    stepIndex += 1;
  }

  if (errors.length > 0) {
    await fs.promises.writeFile(path.join(outputDir, "errors.json"), JSON.stringify(errors, null, 2));
  }

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
