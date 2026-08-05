import { BAY_HEIGHT, bayToPixel, ROW_SPACING } from "@/lib/grid-geometry";
import type { ProjectData } from "@/lib/storage/project-data";
import type { Grid, Vine } from "@/types";

export interface LayoutPreviewBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface LayoutPreviewGridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LayoutPreviewDot {
  cx: number;
  cy: number;
}

export interface LayoutPreviewShape {
  bounds: LayoutPreviewBounds | null;
  gridLines: LayoutPreviewGridLine[];
  vineDots: LayoutPreviewDot[];
  objectDots: LayoutPreviewDot[];
}

function extendBounds(
  bounds: LayoutPreviewBounds,
  x: number,
  y: number,
  padding = 12
): LayoutPreviewBounds {
  return {
    minX: Math.min(bounds.minX, x - padding),
    minY: Math.min(bounds.minY, y - padding),
    maxX: Math.max(bounds.maxX, x + padding),
    maxY: Math.max(bounds.maxY, y + padding),
  };
}

function vinesForGrid(grid: Grid, vines: Vine[]): Vine[] {
  return vines.filter((vine) => vine.gridId === grid.id);
}

export function buildLayoutPreviewShape(data: ProjectData): LayoutPreviewShape {
  const grids = data.grids ?? [];
  const vines = data.vines ?? [];
  const mapObjects = data.mapObjects ?? [];

  if (grids.length === 0) {
    return { bounds: null, gridLines: [], vineDots: [], objectDots: [] };
  }

  const gridLines: LayoutPreviewGridLine[] = [];
  const vineDots: LayoutPreviewDot[] = [];
  const objectDots: LayoutPreviewDot[] = [];

  let bounds: LayoutPreviewBounds | null = null;

  for (const grid of grids) {
    for (let rowNumber = 1; rowNumber <= grid.rows; rowNumber++) {
      const x = grid.position.x + (rowNumber - 1) * ROW_SPACING;
      const yBottom = grid.position.y;
      const yTop = grid.position.y - grid.bayColumns * BAY_HEIGHT;

      gridLines.push({ x1: x, y1: yBottom, x2: x, y2: yTop });

      bounds = bounds
        ? extendBounds(extendBounds(bounds, x, yBottom), x, yTop)
        : {
            minX: x - 12,
            minY: yTop - 12,
            maxX: x + 12,
            maxY: yBottom + 12,
          };
    }

    const gridVines = vinesForGrid(grid, vines).slice(0, 120);
    for (const vine of gridVines) {
      const vinesInBay = gridVines.filter(
        (item) =>
          item.rowNumber === vine.rowNumber && item.bayIndex === vine.bayIndex
      );
      const point = bayToPixel(
        grid,
        vine.rowNumber,
        vine.bayIndex,
        vine.slot,
        vinesInBay
      );
      vineDots.push({ cx: point.x, cy: point.y });
      bounds = bounds
        ? extendBounds(bounds, point.x, point.y)
        : {
            minX: point.x - 12,
            minY: point.y - 12,
            maxX: point.x + 12,
            maxY: point.y + 12,
          };
    }
  }

  for (const object of mapObjects.slice(0, 40)) {
    objectDots.push({ cx: object.x, cy: object.y });
    if (bounds) {
      bounds = extendBounds(bounds, object.x, object.y);
    }
  }

  return { bounds, gridLines, vineDots, objectDots };
}
