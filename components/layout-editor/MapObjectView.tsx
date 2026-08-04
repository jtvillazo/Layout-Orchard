"use client";

import type { MapObject } from "@/types";

import { getObjectTypeDefinition } from "@/lib/object-types";

const BASE_SIZE = 28;

interface MapObjectViewProps {
  object: MapObject;
  selected: boolean;
  onObjectClick: (object: MapObject) => void;
}

export function MapObjectView({
  object,
  selected,
  onObjectClick,
}: MapObjectViewProps) {
  const definition = getObjectTypeDefinition(object.icon ?? "sensor");
  const size = BASE_SIZE * object.scale;
  const half = size / 2;
  const fill = object.color ?? definition.placeholderColor;

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
          cx={object.position.x}
          cy={object.position.y}
          r={half + 6}
          fill="none"
          stroke="#2f4034"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

      <circle
        cx={object.position.x}
        cy={object.position.y}
        r={half}
        fill={fill}
        stroke="#FFFFFF"
        strokeWidth={2}
        pointerEvents="all"
      />

      <text
        x={object.position.x}
        y={object.position.y + 5}
        textAnchor="middle"
        fontSize={Math.max(10, size * 0.38)}
        fontWeight="700"
        fill="#FFFFFF"
        pointerEvents="none"
      >
        {definition.placeholderLabel}
      </text>

      {object.text && (
        <text
          x={object.position.x}
          y={object.position.y + half + 14}
          textAnchor="middle"
          fontSize={11}
          fill="#374151"
          pointerEvents="none"
        >
          {object.text}
        </text>
      )}
    </g>
  );
}
