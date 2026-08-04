"use client";

import type { MouseEvent } from "react";
import type { Grid, Vine, Treatment } from "@/types";
import { bayToPixel, BAY_HEIGHT, getRowLineEndpoints, getRowLabelPosition, ROW_SPACING } from "@/lib/grid-geometry";

interface GridViewProps {
  grid: Grid;
  vines: Vine[];
  treatments: Treatment[];
  rowLabels: Record<number, string>; // rowNumber → label asignado (sección 5)
  numberingMode?: boolean;
  showNumberLabels?: boolean;
  duplicateVineIds?: Set<string>;
  onVineClick?: (vine: Vine) => void;
}

const UNTREATED_COLOR = "#D1D5DB"; // gris, para vines sin treatment (sección 4: estado default)
const VINE_RADIUS = 8;
const LINE_OVERHANG = BAY_HEIGHT * 0.1;

export function GridView({
  grid,
  vines,
  treatments,
  rowLabels,
  numberingMode = false,
  showNumberLabels = false,
  duplicateVineIds,
  onVineClick,
}: GridViewProps) {
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

  const rowStroke = numberingMode ? "#9CA3AF" : "#374151";
  const bayStrokeOpacity = numberingMode ? 0.22 : 0.35;

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
              stroke={rowStroke}
              strokeWidth={3}
              opacity={numberingMode ? 0.75 : 1}
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

        const vineStyle = {
          cursor: onVineClick ? "pointer" : "default",
          pointerEvents: onVineClick ? "all" : "none",
        } as const;

        const handleVineClick = (event: MouseEvent) => {
          event.stopPropagation();
          onVineClick?.(vine);
        };

        const showLabel =
          showNumberLabels &&
          vine.treatmentId !== null &&
          vine.number !== null;
        const isDuplicate = duplicateVineIds?.has(vine.id) ?? false;
        const labelColor = isDuplicate
          ? "#DC2626"
          : numberingMode
            ? "#16A34A"
            : "#111827";

        const shape = vine.gender === "male" ? (
          <rect
            key={`${vine.id}-shape`}
            data-vine-id={vine.id}
            x={point.x - VINE_RADIUS}
            y={point.y - VINE_RADIUS}
            width={VINE_RADIUS * 2}
            height={VINE_RADIUS * 2}
            fill={color}
            stroke="#111827"
            strokeWidth={1}
            style={vineStyle}
            onClick={handleVineClick}
          />
        ) : (
          <circle
            key={`${vine.id}-shape`}
            data-vine-id={vine.id}
            cx={point.x}
            cy={point.y}
            r={VINE_RADIUS}
            fill={color}
            stroke="#111827"
            strokeWidth={1}
            style={vineStyle}
            onClick={handleVineClick}
          />
        );

        return (
          <g key={vine.id}>
            {shape}
            {showLabel && (
              <text
                x={point.x + 12}
                y={point.y + 4}
                fontSize={12}
                fontWeight={600}
                fill={labelColor}
                pointerEvents="none"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >
                {`Vine ${vine.number}`}
              </text>
            )}
          </g>
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
          stroke={rowStroke}
          strokeWidth={1}
          opacity={bayStrokeOpacity}
          pointerEvents="none"
        />
      ))}
    </g>
  );
}