export interface ContentRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MIN_CONTENT_RECT_SIZE = 80;

export function normalizeContentRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): ContentRect {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.max(Math.abs(x2 - x1), MIN_CONTENT_RECT_SIZE);
  const height = Math.max(Math.abs(y2 - y1), MIN_CONTENT_RECT_SIZE);

  return { x, y, width, height };
}

export function clampContentRect(rect: ContentRect): ContentRect {
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(rect.width, MIN_CONTENT_RECT_SIZE),
    height: Math.max(rect.height, MIN_CONTENT_RECT_SIZE),
  };
}

export function pointInContentRect(
  x: number,
  y: number,
  rect: ContentRect,
  margin = 0
): boolean {
  return (
    x >= rect.x - margin &&
    x <= rect.x + rect.width + margin &&
    y >= rect.y - margin &&
    y <= rect.y + rect.height + margin
  );
}

export function moveContentRect(
  rect: ContentRect,
  dx: number,
  dy: number
): ContentRect {
  return {
    ...rect,
    x: rect.x + dx,
    y: rect.y + dy,
  };
}

export type ResizeHandle =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export function resizeContentRect(
  rect: ContentRect,
  handle: ResizeHandle,
  pointerX: number,
  pointerY: number,
  anchor: ContentRect
): ContentRect {
  let { x, y, width, height } = { ...anchor };

  const right = x + width;
  const bottom = y + height;

  if (handle.includes("w")) {
    x = Math.min(pointerX, right - MIN_CONTENT_RECT_SIZE);
    width = right - x;
  }
  if (handle.includes("e")) {
    width = Math.max(pointerX - x, MIN_CONTENT_RECT_SIZE);
  }
  if (handle.includes("n")) {
    y = Math.min(pointerY, bottom - MIN_CONTENT_RECT_SIZE);
    height = bottom - y;
  }
  if (handle.includes("s")) {
    height = Math.max(pointerY - y, MIN_CONTENT_RECT_SIZE);
  }

  return clampContentRect({ x, y, width, height });
}
