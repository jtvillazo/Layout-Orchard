"use client";

import { Group } from "react-konva";
import type { ViewBox } from "@/lib/viewport";
import { getViewBoxPivot, getViewBoxScale } from "@/lib/viewport";

interface CameraGroupProps {
  viewBox: ViewBox;
  rotation: number;
  stageWidth: number;
  stageHeight: number;
  children: React.ReactNode;
}

/**
 * Applies the same pan/zoom/rotate camera transform used by the legacy SVG viewBox.
 * Place one CameraGroup at the root of each Konva Layer so layers stay independent.
 */
export function CameraGroup({
  viewBox,
  rotation,
  stageWidth,
  stageHeight,
  children,
}: CameraGroupProps) {
  const { scale } = getViewBoxScale(viewBox, stageWidth, stageHeight);
  const pivot = getViewBoxPivot(viewBox);

  return (
    <Group
      scaleX={scale}
      scaleY={scale}
      x={-viewBox.x * scale}
      y={-viewBox.y * scale}
    >
      <Group
        offsetX={pivot.x}
        offsetY={pivot.y}
        rotation={rotation}
        x={pivot.x}
        y={pivot.y}
      >
        {children}
      </Group>
    </Group>
  );
}
