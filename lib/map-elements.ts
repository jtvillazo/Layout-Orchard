import type { MapObject, MapText } from "@/types";
import type { PixelPoint } from "@/lib/grid-geometry";

import { DEFAULT_OBJECT_SIZE } from "@/lib/object-shapes";

export const DEFAULT_LONG_PRESS_MS = 600;
export const MAP_ELEMENT_LONG_PRESS_MS = 1000;

const TEXT_CHAR_WIDTH = 7;

export function getObjectHitRadius(object: MapObject) {
  return (object.size ?? DEFAULT_OBJECT_SIZE) / 2 + 4;
}

export function findObjectAtPoint(objects: MapObject[], point: PixelPoint) {
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];
    const distance = Math.hypot(point.x - object.x, point.y - object.y);

    if (distance <= getObjectHitRadius(object)) {
      return object;
    }
  }

  return null;
}

export function getTextBounds(text: MapText) {
  const width = Math.max(32, text.text.length * TEXT_CHAR_WIDTH * (text.fontSize / 14));
  const height = text.fontSize * 1.4;

  return {
    x: text.x - width / 2,
    y: text.y - height / 2,
    width,
    height,
  };
}

export function findTextAtPoint(texts: MapText[], point: PixelPoint) {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index];
    const bounds = getTextBounds(text);

    if (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    ) {
      return text;
    }
  }

  return null;
}
