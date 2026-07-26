"use client";

import type { Grid, Vine, Treatment } from "@/types";
import { bayToPixel, getRowLineEndpoints, getRowLabelPosition } from "@/lib/grid-geometry";

interface GridViewProps {
  grid: Grid;
  vines: Vine[];
  treatments: Treatment[];
  rowLabels: Record<number, string>; // rowNumber → label asignado (sección 5)
  onVineClick?: (vine: Vine) => void;
}

const UNTREATED_COLOR = "#D1D5DB"; // gris, para vines sin treatment (sección 4: estado default)
const VINE_RADIUS = 8;

export function GridView({ grid, vines, treatments, rowLabels, onVineClick }: GridViewProps) {
  const treatmentById = new Map(treatments.map((t) => [t.id, t]));

  // Agrupamos las vines por bay (mismo row+bay), porque bayToPixel
  // necesita saber cuántas hay en total ahí para repartir las posiciones
  const vinesByBayKey = new Map<string, Vine[]>();
  vines.forEach((vine) => {
    const key = `${vine.rowNumber}|${vine.bayIndex}`;
    const existing = vinesByBayKey.get(key) ?? [];
    vinesByBayKey.set(key, [...existing, vine]);
  });

  const rowNumbers = Array.from({ length: grid.rows }, (_, i) => i + 1);

  return (
    <g style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Líneas de los rows */}
      {rowNumbers.map((rowNumber) => {
        const { bottom, top } = getRowLineEndpoints(grid, rowNumber);
        const labelPos = getRowLabelPosition(grid, rowNumber);
        const label = rowLabels[rowNumber];

        return (
          <g key={`row-${rowNumber}`}>
            <line
              x1={bottom.x}
              y1={bottom.y}
              x2={top.x}
              y2={top.y}
              stroke="#374151"
              strokeWidth={3}
            />
            {label && (
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                fontSize={14}
                fontWeight="bold"
                fill="#374151"
                pointerEvents="none"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {/* Vines */}
      {vines.map((vine) => {
        const bayKey = `${vine.rowNumber}|${vine.bayIndex}`;
        const vinesInSameBay = vinesByBayKey.get(bayKey) ?? [vine];

        const point = bayToPixel(
          grid,
          vine.rowNumber,
          vine.bayIndex,
          vine.slot,
          vinesInSameBay
        );

        const treatment = vine.treatmentId ? treatmentById.get(vine.treatmentId) : null;
        const color = treatment?.color ?? UNTREATED_COLOR;

        return (
          <circle
            key={vine.id}
            cx={point.x}
            cy={point.y}
            r={VINE_RADIUS}
            fill={color}
            stroke="#111827"
            strokeWidth={1}
            style={{
              cursor: onVineClick ? "pointer" : "default",
              pointerEvents: onVineClick ? "all" : "none",
            }}
            onClick={() => onVineClick?.(vine)}
          />
        );
      })}
    </g>
  );
}