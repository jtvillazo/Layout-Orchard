"use client";

import { Children, isValidElement, type ReactNode } from "react";

export type CanvasLayerSlot = "grid" | "vines" | "objects" | "text" | "selection";

export const CANVAS_LAYER_ORDER: CanvasLayerSlot[] = [
  "grid",
  "vines",
  "objects",
  "text",
  "selection",
];

type LayerComponent = {
  (props: { children?: ReactNode }): ReactNode;
  slot: CanvasLayerSlot;
};

function createLayerComponent(slot: CanvasLayerSlot): LayerComponent {
  const Layer = ({ children }: { children?: ReactNode }) => children ?? null;
  Layer.slot = slot;
  return Layer;
}

export const GridLayer = createLayerComponent("grid");
export const VinesLayer = createLayerComponent("vines");
export const ObjectsLayer = createLayerComponent("objects");
export const TextLayer = createLayerComponent("text");
export const SelectionLayer = createLayerComponent("selection");

export function extractCanvasLayers(children: ReactNode): Partial<Record<CanvasLayerSlot, ReactNode>> {
  const layers: Partial<Record<CanvasLayerSlot, ReactNode>> = {};

  Children.forEach(children, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;

    const type = child.type as LayerComponent;
    if (typeof type === "function" && type.slot) {
      layers[type.slot] = child.props.children;
    }
  });

  return layers;
}
