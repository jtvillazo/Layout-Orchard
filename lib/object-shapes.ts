import type { ObjectShape } from "@/types";

export interface ObjectShapeDefinition {
  shape: ObjectShape;
  label: string;
  symbol: string;
}

export const OBJECT_SHAPE_DEFINITIONS: ObjectShapeDefinition[] = [
  { shape: "circle", label: "Circle", symbol: "○" },
  { shape: "square", label: "Square", symbol: "□" },
  { shape: "triangle", label: "Triangle", symbol: "△" },
];

export const DEFAULT_OBJECT_COLOR = "#5B6B8C";
export const DEFAULT_OBJECT_SIZE = 24;
export const MIN_OBJECT_SIZE = 12;
export const MAX_OBJECT_SIZE = 80;
