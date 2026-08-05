"use client";

import type { MapText } from "@/types";

import { getTextBounds } from "@/lib/map-elements";
import {
  getLabelBackgroundBounds,
  LABEL_BG_OPACITY,
} from "@/lib/label-background";

interface MapTextViewProps {
  text: MapText;
  selected: boolean;
  onTextClick: (text: MapText) => void;
}

export function MapTextView({ text, selected, onTextClick }: MapTextViewProps) {
  const bounds = getTextBounds(text);
  const labelBg = getLabelBackgroundBounds(
    text.x,
    text.y,
    text.text,
    text.fontSize,
    "middle"
  );

  return (
    <g
      data-map-text-id={text.id}
      pointerEvents="all"
      style={{ cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onTextClick(text);
      }}
    >
      {selected && (
        <rect
          x={bounds.x - 4}
          y={bounds.y - 4}
          width={bounds.width + 8}
          height={bounds.height + 8}
          rx={4}
          fill="none"
          stroke="#2f4034"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

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
        x={text.x}
        y={text.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={text.fontSize}
        fontWeight="600"
        fill="#1F2937"
        pointerEvents="all"
      >
        {text.text}
      </text>
    </g>
  );
}
