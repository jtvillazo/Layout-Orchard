"use client";

import type { MouseEvent } from "react";
import type { Grid, Vine, Treatment } from "@/types";
import {
  bayToPixel,
  BAY_HEIGHT,
  getRowLineEndpoints,
  ROW_SPACING,
} from "@/lib/grid-geometry";
import { useCanvasUi } from "@/components/layout-editor/canvas-ui-context";
import { useCompactViewport } from "@/hooks/useCompactViewport";
import {
  getRowHandleContentMetrics,
  type RowHandleContentMetrics,
} from "@/lib/row-numbers";

interface GridViewProps {
  grid: Grid;
  vines: Vine[];
  treatments: Treatment[];
  rowDisplayNumbers: Record<number, number | null>;
  numberingMode?: boolean;
  showNumberLabels?: boolean;
  duplicateVineIds?: Set<string>;
  onVineClick?: (vine: Vine) => void;
  onRowNumberHandleClick?: (rowNumber: number) => void;
}

const UNTREATED_COLOR = "#D1D5DB";
const VINE_RADIUS = 8;
const LINE_OVERHANG = BAY_HEIGHT * 0.1;

interface RowNumberHandleProps {
  x: number;
  y: number;
  end: "top" | "bottom";
  displayNumber: number | null;
  metrics: RowHandleContentMetrics;
  onClick: () => void;
}

const ROW_LABEL_ROTATION = -45;

function RowNumberHandle({
  x,
  y,
  end,
  displayNumber,
  metrics,
  onClick,
}: RowNumberHandleProps) {
  const { hitRadius, dotRadius, fontSize, labelOffset, strokeWidth } = metrics;

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onClick();
  };

  // Bottom: end of "Row X" sits near the row start (bottom endpoint).
  // Top: start of "Row X" sits near the row end (top endpoint).
  // Both labels share the same -45° tilt along the row direction.
  const labelX =
    end === "bottom" ? x + labelOffset : x - labelOffset;
  const labelY =
    end === "bottom" ? y + labelOffset : y - labelOffset;

  return (
    <g
      data-row-number-handle=""
      style={{ cursor: "pointer", pointerEvents: "all" }}
      onClick={handleClick}
    >
      <circle cx={x} cy={y} r={hitRadius} fill="transparent" />
      <circle
        cx={x}
        cy={y}
        r={dotRadius}
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth={strokeWidth}
      />
      {displayNumber !== null && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={end === "bottom" ? "end" : "start"}
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight={600}
          fill="#6B7280"
          pointerEvents="none"
          transform={`rotate(${ROW_LABEL_ROTATION}, ${labelX}, ${labelY})`}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {`Row ${displayNumber}`}
        </text>
      )}
    </g>
  );
}

export function GridView({
  grid,
  vines,
  treatments,
  rowDisplayNumbers,
  numberingMode = false,
  showNumberLabels = false,
  duplicateVineIds,
  onVineClick,
  onRowNumberHandleClick,
}: GridViewProps) {
  const { getContentUiScale, viewRevision } = useCanvasUi();
  const compactViewport = useCompactViewport();
  const uiScale = getContentUiScale();
  const rowHandleMetrics = getRowHandleContentMetrics(uiScale, compactViewport);
  void viewRevision;

  const treatmentById = new Map(treatments.map((t) => [t.id, t]));

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

  const rowHandleNodes =
    onRowNumberHandleClick &&
    rowNumbers.map((rowNumber) => {
      const { bottom, top } = getRowLineEndpoints(grid, rowNumber);
      const displayNumber = rowDisplayNumbers[rowNumber] ?? null;

      return (
        <g key={`row-handles-${rowNumber}`}>
          <RowNumberHandle
            x={bottom.x}
            y={bottom.y}
            end="bottom"
            displayNumber={displayNumber}
            metrics={rowHandleMetrics}
            onClick={() => onRowNumberHandleClick(rowNumber)}
          />
          <RowNumberHandle
            x={top.x}
            y={top.y}
            end="top"
            displayNumber={displayNumber}
            metrics={rowHandleMetrics}
            onClick={() => onRowNumberHandleClick(rowNumber)}
          />
        </g>
      );
    });

  return (
    <g style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {rowNumbers.map((rowNumber) => {
        const { bottom, top } = getRowLineEndpoints(grid, rowNumber);

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
              pointerEvents="none"
            />
          </g>
        );
      })}

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

      {rowHandleNodes}
    </g>
  );
}
