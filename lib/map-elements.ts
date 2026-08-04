import type { MapObject, MapText } from "@/types";
import type { PixelPoint } from "@/lib/grid-geometry";

const OBJECT_HIT_RADIUS = 18;
const TEXT_CHAR_WIDTH = 8;
const TEXT_HEIGHT = 20;

export function getObjectHitRadius(object: MapObject) {
  return OBJECT_HIT_RADIUS * (object.scale || 1);
}

export function findObjectAtPoint(objects: MapObject[], point: PixelPoint) {
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    const object = objects[index];
    const radius = getObjectHitRadius(object);
    const distance = Math.hypot(
      point.x - object.position.x,
      point.y - object.position.y
    );

    if (distance <= radius) {
      return object;
    }
  }

  return null;
}

export function getTextBounds(text: MapText) {
  const width = Math.max(40, text.content.length * TEXT_CHAR_WIDTH * text.scale);
  const height = TEXT_HEIGHT * text.scale;

  return {
    x: text.position.x - width / 2,
    y: text.position.y - height / 2,
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
