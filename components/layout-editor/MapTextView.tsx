"use client";

import type { MapText } from "@/types";

interface MapTextViewProps {
  text: MapText;
  selected: boolean;
  onTextClick: (text: MapText) => void;
}

export function MapTextView({ text, selected, onTextClick }: MapTextViewProps) {
  const fontSize = 14 * text.scale;

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
          x={text.position.x - (text.content.length * 4 + 12) * text.scale}
          y={text.position.y - fontSize * 0.75}
          width={Math.max(48, text.content.length * 8 + 24) * text.scale}
          height={fontSize * 1.5}
          rx={4}
          fill="none"
          stroke="#2f4034"
          strokeWidth={2}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}

      <text
        x={text.position.x}
        y={text.position.y}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fill="#1F2937"
        pointerEvents="all"
      >
        {text.content || "Text"}
      </text>
    </g>
  );
}
