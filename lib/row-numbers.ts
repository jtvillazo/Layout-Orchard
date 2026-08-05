import type { Grid, Row, UUID } from "@/types";

import {
  getRowLineEndpoints,
  type PixelPoint,
} from "@/lib/grid-geometry";

/** Content-space hit radius for row-number handles (touch-friendly). */
export const ROW_HANDLE_HIT_RADIUS = 28;

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
  point: PixelPoint
): { gridId: UUID; rowNumber: number } | null {
  for (const grid of grids) {
    for (let rowNumber = 1; rowNumber <= grid.rows; rowNumber++) {
      const { bottom, top } = getRowLineEndpoints(grid, rowNumber);

      if (
        distance(point, bottom) <= ROW_HANDLE_HIT_RADIUS ||
        distance(point, top) <= ROW_HANDLE_HIT_RADIUS
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
