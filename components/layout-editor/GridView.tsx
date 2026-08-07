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
import { getTreatmentVineColors } from "@/lib/treatment-colors";
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

interface VineShapeProps {
  vineId: string;
  x: number;
  y: number;
  gender: Vine["gender"];
  primaryColor: string;
  secondaryColor: string | null;
  vineStyle: {
    cursor: "pointer" | "default";
    pointerEvents: "all" | "none";
  };
  onClick: (event: MouseEvent) => void;
}

function VineShape({
  vineId,
  x,
  y,
  gender,
  primaryColor,
  secondaryColor,
  vineStyle,
  onClick,
}: VineShapeProps) {
  const twoTone = secondaryColor !== null;

  if (gender === "male") {
    if (!twoTone) {
      return (
        <rect
          data-vine-id={vineId}
          x={x - VINE_RADIUS}
          y={y - VINE_RADIUS}
          width={VINE_RADIUS * 2}
          height={VINE_RADIUS * 2}
          fill={primaryColor}
          stroke="#111827"
          strokeWidth={1}
          style={vineStyle}
          onClick={onClick}
        />
      );
    }

    return (
      <g data-vine-id={vineId} style={vineStyle} onClick={onClick}>
        <rect
          x={x - VINE_RADIUS}
          y={y - VINE_RADIUS}
          width={VINE_RADIUS * 2}
          height={VINE_RADIUS}
          fill={primaryColor}
          stroke="none"
        />
        <rect
          x={x - VINE_RADIUS}
          y={y}
          width={VINE_RADIUS * 2}
          height={VINE_RADIUS}
          fill={secondaryColor}
          stroke="none"
        />
        <rect
          x={x - VINE_RADIUS}
          y={y - VINE_RADIUS}
          width={VINE_RADIUS * 2}
          height={VINE_RADIUS * 2}
          fill="none"
          stroke="#111827"
          strokeWidth={1}
        />
      </g>
    );
  }

  if (!twoTone) {
    return (
      <circle
        data-vine-id={vineId}
        cx={x}
        cy={y}
        r={VINE_RADIUS}
        fill={primaryColor}
        stroke="#111827"
        strokeWidth={1}
        style={vineStyle}
        onClick={onClick}
      />
    );
  }

  return (
    <g data-vine-id={vineId} style={vineStyle} onClick={onClick}>
      <path
        d={`M ${x - VINE_RADIUS} ${y} A ${VINE_RADIUS} ${VINE_RADIUS} 0 0 1 ${x + VINE_RADIUS} ${y} Z`}
        fill={primaryColor}
        stroke="none"
      />
      <path
        d={`M ${x - VINE_RADIUS} ${y} A ${VINE_RADIUS} ${VINE_RADIUS} 0 0 0 ${x + VINE_RADIUS} ${y} Z`}
        fill={secondaryColor}
        stroke="none"
      />
      <circle
        cx={x}
        cy={y}
        r={VINE_RADIUS}
        fill="none"
        stroke="#111827"
        strokeWidth={1}
      />
    </g>
  );
}

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
        const { primary: color, secondary: secondaryColor } =
          getTreatmentVineColors(treatment);

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

        return (
          <g key={vine.id}>
            <VineShape
              vineId={vine.id}
              x={point.x}
              y={point.y}
              gender={vine.gender}
              primaryColor={color}
              secondaryColor={secondaryColor}
              vineStyle={vineStyle}
              onClick={handleVineClick}
            />
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
