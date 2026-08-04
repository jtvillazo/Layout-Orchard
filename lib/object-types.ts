import type { PredefinedObjectIcon } from "@/types";

export interface ObjectTypeDefinition {
  type: PredefinedObjectIcon;
  name: string;
  icon: string;
  placeholderColor: string;
  placeholderLabel: string;
}

export const OBJECT_TYPE_DEFINITIONS: ObjectTypeDefinition[] = [
  {
    type: "sensor",
    name: "Sensor",
    icon: "/icons/objects/sensor.svg",
    placeholderColor: "#3B82F6",
    placeholderLabel: "S",
  },
  {
    type: "camera",
    name: "Camera",
    icon: "/icons/objects/camera.svg",
    placeholderColor: "#6366F1",
    placeholderLabel: "C",
  },
  {
    type: "water",
    name: "Water",
    icon: "/icons/objects/water.svg",
    placeholderColor: "#0EA5E9",
    placeholderLabel: "W",
  },
];

const definitionByType = new Map(
  OBJECT_TYPE_DEFINITIONS.map((definition) => [definition.type, definition])
);

export function getObjectTypeDefinition(type: PredefinedObjectIcon) {
  return definitionByType.get(type) ?? OBJECT_TYPE_DEFINITIONS[0];
}

export const DEFAULT_OBJECT_TYPE: PredefinedObjectIcon = "sensor";
