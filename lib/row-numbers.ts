import type { Grid, Row, UUID } from "@/types";

import {
  getRowLineEndpoints,
  type PixelPoint,
} from "@/lib/grid-geometry";

/** @deprecated use getRowHandleHitRadiusContent — kept as fallback content-space radius */
export const ROW_HANDLE_HIT_RADIUS = 28;

/** Viewport width at or below this uses compact row-handle sizing (phones / small tablets). */
export const ROW_HANDLE_COMPACT_BREAKPOINT_PX = 768;

/** Screen-pixel targets before converting to SVG content units via uiScale. */
export interface RowHandleScreenMetrics {
  hitRadiusPx: number;
  dotRadiusPx: number;
  fontSizePx: number;
  labelGapPx: number;
  strokeWidthPx: number;
}

const DESKTOP_ROW_HANDLE_METRICS: RowHandleScreenMetrics = {
  hitRadiusPx: 16,
  dotRadiusPx: 7,
  fontSizePx: 35,
  labelGapPx: 24,
  strokeWidthPx: 0.75,
};

const COMPACT_ROW_HANDLE_METRICS: RowHandleScreenMetrics = {
  hitRadiusPx: 22,
  dotRadiusPx: 3,
  fontSizePx: 10,
  labelGapPx: 6,
  strokeWidthPx: 0.6,
};

export function isCompactRowHandleViewport(
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024
): boolean {
  return viewportWidth <= ROW_HANDLE_COMPACT_BREAKPOINT_PX;
}

export function getRowHandleScreenMetrics(
  compact: boolean
): RowHandleScreenMetrics {
  return compact ? COMPACT_ROW_HANDLE_METRICS : DESKTOP_ROW_HANDLE_METRICS;
}

export interface RowHandleContentMetrics {
  hitRadius: number;
  dotRadius: number;
  fontSize: number;
  labelOffset: number;
  strokeWidth: number;
}

/** Convert screen-pixel row-handle sizes into SVG content units. */
export function rowHandleMetricsToContent(
  metrics: RowHandleScreenMetrics,
  uiScale: number
): RowHandleContentMetrics {
  return {
    hitRadius: metrics.hitRadiusPx * uiScale,
    dotRadius: metrics.dotRadiusPx * uiScale,
    fontSize: metrics.fontSizePx * uiScale,
    labelOffset: (metrics.dotRadiusPx + metrics.labelGapPx) * uiScale,
    strokeWidth: metrics.strokeWidthPx * uiScale,
  };
}

export function getRowHandleContentMetrics(
  uiScale: number,
  compact: boolean
): RowHandleContentMetrics {
  return rowHandleMetricsToContent(getRowHandleScreenMetrics(compact), uiScale);
}

export function getRowHandleHitRadiusContent(
  uiScale: number,
  compact: boolean
): number {
  return getRowHandleScreenMetrics(compact).hitRadiusPx * uiScale;
}

/** Rough uiScale when Canvas context is unavailable (e.g. long-press hit test). */
export function estimateCanvasUiScale(viewBoxWidth = 1500): number {
  if (typeof window === "undefined") {
    return 1;
  }

  return viewBoxWidth / Math.max(window.innerWidth, 1);
}

function distance(a: PixelPoint, b: PixelPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function parseLegacyLabel(label: string | null | undefined): number | null {
  if (label == null || label.trim() === "") {
    return null;
  }

  const parsed = Number(label.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

/** Normalize persisted rows and migrate legacy `label` strings to displayNumber. */
export function normalizeRows(rows: Row[]): Row[] {
  return rows.map((row) => {
    const displayNumber =
      row.displayNumber !== undefined
        ? row.displayNumber
        : parseLegacyLabel(row.label ?? null);

    return {
      ...row,
      displayNumber,
    };
  });
}

function rowKey(gridId: UUID, index: number): string {
  return `${gridId}|${index}`;
}

/**
 * Ensure every physical row in every grid has a Row record.
 * Preserves existing displayNumber values.
 */
export function ensureLayoutRows(grids: Grid[], existingRows: Row[]): Row[] {
  const normalized = normalizeRows(existingRows);
  const byKey = new Map<string, Row>();

  normalized.forEach((row) => {
    byKey.set(rowKey(row.gridId, row.index), row);
  });

  const result: Row[] = [];

  grids.forEach((grid) => {
    for (let index = 1; index <= grid.rows; index++) {
      const key = rowKey(grid.id, index);
      const existing = byKey.get(key);

      if (existing) {
        result.push(existing);
        continue;
      }

      result.push({
        id: `${grid.id}-row-${index}`,
        gridId: grid.id,
        index,
        displayNumber: null,
      });
    }
  });

  return result;
}

export function getGridRowDisplayNumbers(
  gridId: UUID,
  rows: Row[]
): Record<number, number | null> {
  const result: Record<number, number | null> = {};

  rows
    .filter((row) => row.gridId === gridId)
    .forEach((row) => {
      result[row.index] = row.displayNumber ?? null;
    });

  return result;
}

export function findRowHandleAtPoint(
  grids: Grid[],
  point: PixelPoint,
  hitRadius = ROW_HANDLE_HIT_RADIUS
): { gridId: UUID; rowNumber: number } | null {
  for (const grid of grids) {
    for (let rowNumber = 1; rowNumber <= grid.rows; rowNumber++) {
      const { bottom, top } = getRowLineEndpoints(grid, rowNumber);

      if (
        distance(point, bottom) <= hitRadius ||
        distance(point, top) <= hitRadius
      ) {
        return { gridId: grid.id, rowNumber };
      }
    }
  }

  return null;
}

export function updateRowDisplayNumber(
  rows: Row[],
  gridId: UUID,
  rowNumber: number,
  displayNumber: number | null
): Row[] {
  const hasRow = rows.some(
    (row) => row.gridId === gridId && row.index === rowNumber
  );

  if (!hasRow) {
    return [
      ...rows,
      {
        id: `${gridId}-row-${rowNumber}`,
        gridId,
        index: rowNumber,
        displayNumber,
      },
    ];
  }

  return rows.map((row) =>
    row.gridId === gridId && row.index === rowNumber
      ? { ...row, displayNumber }
      : row
  );
}

export function createRowsForGrid(
  gridId: UUID,
  rowCount: number,
  createId: () => UUID
): Row[] {
  return Array.from({ length: rowCount }, (_, index) => ({
    id: createId(),
    gridId,
    index: index + 1,
    displayNumber: null,
  }));
}
