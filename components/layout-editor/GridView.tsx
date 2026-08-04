"use client";

import type { Grid, Vine, Treatment } from "@/types";
import { bayToPixel, BAY_HEIGHT, getRowLineEndpoints, getRowLabelPosition, ROW_SPACING } from "@/lib/grid-geometry";

interface GridViewProps {
  grid: Grid;
  vines: Vine[];
  treatments: Treatment[];
  rowLabels: Record<number, string>; // rowNumber → label asignado (sección 5)
  onVineClick?: (vine: Vine) => void;
}

const UNTREATED_COLOR = "#D1D5DB"; // gris, para vines sin treatment (sección 4: estado default)
const VINE_RADIUS = 8;
const LINE_OVERHANG = BAY_HEIGHT * 0.1;

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
  const gridLeftX = grid.position.x;
  const gridRightX = grid.position.x + (grid.rows - 1) * ROW_SPACING;
  const baySeparatorYs = Array.from(
    { length: grid.bayColumns + 1 },
    (_, index) => grid.position.y - index * BAY_HEIGHT
  );

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
              y1={bottom.y + LINE_OVERHANG}
              x2={top.x}
              y2={top.y - LINE_OVERHANG}
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

      {/* Separadores transversales entre bays (por encima de las vines) */}
      {baySeparatorYs.map((y, index) => (
        <line
          key={`bay-separator-${index}`}
          x1={gridLeftX - LINE_OVERHANG}
          y1={y}
          x2={gridRightX + LINE_OVERHANG}
          y2={y}
          stroke="#374151"
          strokeWidth={1}
          opacity={0.35}
          pointerEvents="none"
        />
      ))}
    </g>
  );
}