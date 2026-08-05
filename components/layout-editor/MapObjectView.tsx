"use client";

import type { MapObject } from "@/types";

import { DEFAULT_OBJECT_COLOR, DEFAULT_OBJECT_SIZE } from "@/lib/object-shapes";
import {
  getLabelBackgroundBounds,
  LABEL_BG_OPACITY,
} from "@/lib/label-background";

interface MapObjectViewProps {
  object: MapObject;
  selected: boolean;
  onObjectClick: (object: MapObject) => void;
}

function getObjectLabelLayout(object: MapObject) {
  const shapeSize = object.size ?? DEFAULT_OBJECT_SIZE;
  const fontSize = Math.round(Math.max(10, Math.min(shapeSize * 0.4, 24)));
  const name = object.name.trim();
  const textWidth = name.length * fontSize * 0.52;
  const fitsInside = shapeSize >= 34 && textWidth <= shapeSize * 0.88;

  if (fitsInside) {
    const labelY =
      object.shape === "triangle" ? object.y + shapeSize * 0.12 : object.y;

    return {
      x: object.x,
      y: labelY,
      fontSize,
      fill: "#FFFFFF",
      inside: true,
    };
  }

  return {
    x: object.x,
    y: object.y + shapeSize / 2 + fontSize * 0.55 + 6,
    fontSize,
    fill: "#374151",
    inside: false,
  };
}

function ObjectShapeGraphic({ object }: { object: MapObject }) {
  const { x, y, shape } = object;
  const shapeSize = object.size ?? DEFAULT_OBJECT_SIZE;
  const fill = object.color ?? DEFAULT_OBJECT_COLOR;
  const stroke = "#FFFFFF";

  if (shape === "square") {
    const half = shapeSize / 2;
    return (
      <rect
        x={x - half}
        y={y - half}
        width={shapeSize}
        height={shapeSize}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        pointerEvents="all"
      />
    );
  }

  if (shape === "triangle") {
    const half = shapeSize / 2;
    return (
      <polygon
        points={`${x},${y - half} ${x - half},${y + half * 0.75} ${x + half},${y + half * 0.75}`}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        pointerEvents="all"
      />
    );
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={shapeSize / 2}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
      pointerEvents="all"
    />
  );
}

export function MapObjectView({
  object,
  selected,
  onObjectClick,
}: MapObjectViewProps) {
  const shapeSize = object.size ?? DEFAULT_OBJECT_SIZE;
  const label = getObjectLabelLayout(object);
  const labelBg = object.name
    ? getLabelBackgroundBounds(
        label.x,
        label.y,
        object.name,
        label.fontSize,
        label.inside ? "middle" : "baseline"
      )
    : null;

  return (
    <g
      data-map-object-id={object.id}
      pointerEvents="all"
      style={{ cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onObjectClick(object);
      }}
    >
      {selected && (
        <circle
          cx={object.x}
          cy={object.y}
          r={shapeSize / 2 + 8}
          fill="none"
          stroke="#2f4034"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

      <ObjectShapeGraphic object={object} />

      {object.name && labelBg && (
        <>
          <rect
            x={labelBg.x}
            y={labelBg.y}
            width={labelBg.width}
            height={labelBg.height}
            rx={labelBg.rx}
            fill="#FFFFFF"
            fillOpacity={LABEL_BG_OPACITY}
            pointerEvents="none"
          />
          <text
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline={label.inside ? "middle" : "auto"}
            fontSize={label.fontSize}
            fontWeight="600"
            fill={label.fill}
            pointerEvents="none"
          >
            {object.name}
          </text>
        </>
      )}
    </g>
  );
}
