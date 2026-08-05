import type { MapObject, MapText } from "@/types";

import { DEFAULT_OBJECT_COLOR, DEFAULT_OBJECT_SIZE } from "@/lib/object-shapes";

type LegacyMapObject = MapObject & {
  position?: { x: number; y: number };
  text?: string;
  kind?: string;
  scale?: number;
  color?: string;
};

type LegacyMapText = MapText & {
  position?: { x: number; y: number };
  content?: string;
  scale?: number;
};

export function normalizeMapObject(raw: LegacyMapObject): MapObject | null {
  if (
    typeof raw.id === "string" &&
    typeof raw.layoutId === "string" &&
    typeof raw.x === "number" &&
    typeof raw.y === "number" &&
    typeof raw.name === "string" &&
    raw.shape
  ) {
    return {
      id: raw.id,
      layoutId: raw.layoutId,
      x: raw.x,
      y: raw.y,
      name: raw.name,
      shape: raw.shape,
      color: raw.color ?? DEFAULT_OBJECT_COLOR,
      size: raw.size ?? DEFAULT_OBJECT_SIZE,
      ...(raw.comment ? { comment: raw.comment } : {}),
    };
  }

  if (!raw.position) {
    return null;
  }

  const legacyShape = raw.shape;
  let shape: MapObject["shape"] = "circle";
  if (legacyShape === "square" || legacyShape === "triangle") {
    shape = legacyShape;
  }

  return {
    id: raw.id,
    layoutId: raw.layoutId,
    x: raw.position.x,
    y: raw.position.y,
    name: raw.text ?? raw.name ?? "Object",
    shape,
    color: raw.color ?? DEFAULT_OBJECT_COLOR,
    size:
      typeof raw.size === "number"
        ? raw.size
        : Math.round(DEFAULT_OBJECT_SIZE * (raw.scale ?? 1)),
    ...(raw.comment ? { comment: raw.comment } : {}),
  };
}

export function normalizeMapText(raw: LegacyMapText): MapText | null {
  if (
    typeof raw.id === "string" &&
    typeof raw.layoutId === "string" &&
    typeof raw.x === "number" &&
    typeof raw.y === "number" &&
    typeof raw.text === "string" &&
    typeof raw.fontSize === "number"
  ) {
    return {
      id: raw.id,
      layoutId: raw.layoutId,
      x: raw.x,
      y: raw.y,
      text: raw.text,
      fontSize: raw.fontSize,
      ...(raw.comment ? { comment: raw.comment } : {}),
    };
  }

  if (!raw.position) {
    return null;
  }

  const fontSize =
    typeof raw.fontSize === "number"
      ? raw.fontSize
      : Math.round(14 * (raw.scale ?? 1));

  return {
    id: raw.id,
    layoutId: raw.layoutId,
    x: raw.position.x,
    y: raw.position.y,
    text: raw.content ?? raw.text ?? "Text",
    fontSize,
    ...(raw.comment ? { comment: raw.comment } : {}),
  };
}

export function normalizeMapObjects(objects: unknown[]): MapObject[] {
  return objects
    .map((item) => normalizeMapObject(item as LegacyMapObject))
    .filter((item): item is MapObject => item !== null);
}

export function normalizeMapTexts(texts: unknown[]): MapText[] {
  return texts
    .map((item) => normalizeMapText(item as LegacyMapText))
    .filter((item): item is MapText => item !== null);
}
