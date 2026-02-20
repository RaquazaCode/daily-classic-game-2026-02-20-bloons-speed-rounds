import { START_BUTTON } from "./constants";

export interface InputCallbacks {
  onPointerDown: (x: number, y: number) => void;
  onKeyDown: (key: string) => void;
}

function mapPointToCanvas(canvas: HTMLCanvasElement, event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function isStartButtonHit(x: number, y: number): boolean {
  return (
    x >= START_BUTTON.x &&
    x <= START_BUTTON.x + START_BUTTON.width &&
    y >= START_BUTTON.y &&
    y <= START_BUTTON.y + START_BUTTON.height
  );
}

export function bindInput(canvas: HTMLCanvasElement, callbacks: InputCallbacks): () => void {
  const pointerHandler = (event: PointerEvent): void => {
    const point = mapPointToCanvas(canvas, event);
    callbacks.onPointerDown(point.x, point.y);
  };

  const keyHandler = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (
      key === "p" ||
      key === "r" ||
      key === "f" ||
      key === "enter" ||
      key === "escape" ||
      key === "0" ||
      key === "1" ||
      key === "2" ||
      key === "3" ||
      key === "4"
    ) {
      event.preventDefault();
    }
    callbacks.onKeyDown(key);
  };

  canvas.addEventListener("pointerdown", pointerHandler);
  window.addEventListener("keydown", keyHandler);

  return () => {
    canvas.removeEventListener("pointerdown", pointerHandler);
    window.removeEventListener("keydown", keyHandler);
  };
}
