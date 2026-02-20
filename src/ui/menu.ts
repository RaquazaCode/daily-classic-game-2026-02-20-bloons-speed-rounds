import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";
import { MAP_DEFINITIONS } from "../data/maps";
import type { DifficultyChoice } from "../types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAP_CARD_WIDTH = 320;
const MAP_CARD_HEIGHT = 180;
const MAP_CARD_GAP = 26;

const DIFFICULTY_BUTTON_WIDTH = 260;
const DIFFICULTY_BUTTON_HEIGHT = 68;
const DIFFICULTY_BUTTON_GAP = 18;

export const DIFFICULTY_OPTIONS: DifficultyChoice[] = ["easy", "medium", "hard"];

export function mapCardRect(index: number): Rect {
  const totalWidth = MAP_CARD_WIDTH * MAP_DEFINITIONS.length + MAP_CARD_GAP * (MAP_DEFINITIONS.length - 1);
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  const x = startX + index * (MAP_CARD_WIDTH + MAP_CARD_GAP);
  const y = CANVAS_HEIGHT / 2 - MAP_CARD_HEIGHT / 2 + 36;
  return { x, y, width: MAP_CARD_WIDTH, height: MAP_CARD_HEIGHT };
}

export function difficultyButtonRect(index: number): Rect {
  const totalHeight = DIFFICULTY_BUTTON_HEIGHT * DIFFICULTY_OPTIONS.length +
    DIFFICULTY_BUTTON_GAP * (DIFFICULTY_OPTIONS.length - 1);
  const x = CANVAS_WIDTH / 2 - DIFFICULTY_BUTTON_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2 - totalHeight / 2 + index * (DIFFICULTY_BUTTON_HEIGHT + DIFFICULTY_BUTTON_GAP) + 24;
  return { x, y, width: DIFFICULTY_BUTTON_WIDTH, height: DIFFICULTY_BUTTON_HEIGHT };
}

function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function hitMapCard(x: number, y: number): string | null {
  for (let index = 0; index < MAP_DEFINITIONS.length; index += 1) {
    const rect = mapCardRect(index);
    if (pointInRect(x, y, rect)) {
      return MAP_DEFINITIONS[index].id;
    }
  }
  return null;
}

export function hitDifficultyButton(x: number, y: number): DifficultyChoice | null {
  for (let index = 0; index < DIFFICULTY_OPTIONS.length; index += 1) {
    const rect = difficultyButtonRect(index);
    if (pointInRect(x, y, rect)) {
      return DIFFICULTY_OPTIONS[index];
    }
  }
  return null;
}
