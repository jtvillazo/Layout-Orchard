import type { Grid, Vine } from "@/types";

// ─── Constantes de espaciado visual (ajustables) ───
// Todo esquemático, sin unidades reales (sección 4)

export const ROW_SPACING = 80; // distancia horizontal entre rows (eje X)
export const BAY_HEIGHT = 80; // altura de cada tramo de bay (eje Y)

export interface PixelPoint {
  x: number;
  y: number;
}

/**
 * Calcula la fracción vertical (0 = abajo del tramo del bay, 1 = arriba)
 * para un slot, según CUÁNTAS vines en total comparten ese bay.
 *
 * - 1 vine → centrada
 * - 2 vines → en los extremos del tramo (abajo y arriba)
 * - 3 vines → repartidas en tercios (abajo, medio, arriba)
 *
 * El número de slot (1, 2, 3) determina el orden de abajo hacia arriba.
 */
function getFractionForSlot(slot: 1 | 2 | 3, totalVinesInBay: number): number {
  if (totalVinesInBay <= 1) return 0.5;
  if (totalVinesInBay === 2) return slot === 1 ? 0.2 : 0.8;
  if (slot === 1) return 0.2;
  if (slot === 2) return 0.5;
  return 0.8; // slot 3
}

/**
 * Convierte una posición lógica (row, bay, slot) a coordenadas de píxeles
 * dentro del SVG, relativas al origen del Grid (grid.position).
 *
 * Todas las vines de un mismo row comparten la misma X (la línea del row).
 * La Y depende de cuántas vines en total ocupan ese bay — no es una
 * posición fija por slot, se reparten según getFractionForSlot().
 *
 * bayIndex crece hacia ARRIBA (bay 1 es el más bajo, cerca del extremo
 * donde se numera el row — sección 5). Como en SVG el eje Y crece hacia
 * abajo, restamos para "subir" visualmente.
 *
 * @param vinesInSameBay todas las vines que comparten este mismo
 * gridId + rowNumber + bayIndex (para saber cuántas hay en total).
 */
export function bayToPixel(
  grid: Grid,
  rowNumber: number,
  bayIndex: number,
  slot: 1 | 2 | 3,
  vinesInSameBay: Vine[]
): PixelPoint {
  const x = grid.position.x + (rowNumber - 1) * ROW_SPACING;

  const bayBottomY = grid.position.y - (bayIndex - 1) * BAY_HEIGHT;
  const bayTopY = bayBottomY - BAY_HEIGHT;

  const totalVinesInBay = vinesInSameBay.length;
  const fraction = getFractionForSlot(slot, totalVinesInBay);

  const y = bayBottomY - fraction * (bayBottomY - bayTopY);

  return { x, y };
}

/**
 * Convierte un punto en píxeles (por ejemplo, donde el usuario hizo
 * long-press) a la posición lógica (row, bay) más cercana dentro del Grid.
 * Usado para el flujo de crear vine (sección 4).
 *
 * Devuelve null si el punto está fuera de los límites del grid.
 */
export function pixelToBay(
  grid: Grid,
  point: PixelPoint
): { rowNumber: number; bayIndex: number } | null {
  const relativeX = point.x - grid.position.x;
  const relativeY = grid.position.y - point.y; // invertido por el eje Y de SVG

  const rowNumber = Math.round(relativeX / ROW_SPACING) + 1;
  // Cada bay ocupa [k*BAY_HEIGHT, (k+1)*BAY_HEIGHT) en relativeY (k = 0, 1, …).
  // Bay 1 = [0, 60), Bay 2 = [60, 120), etc. La frontera superior de un bay
  // pertenece al bay siguiente (p. ej. relativeY = 60 → Bay 2).
  const bayIndex = Math.floor(relativeY / BAY_HEIGHT) + 1;

  if (rowNumber < 1 || rowNumber > grid.rows) return null;
  if (bayIndex < 1 || bayIndex > grid.bayColumns) return null;

  return { rowNumber, bayIndex };
}

/**
 * Devuelve los dos puntos extremos (inferior y superior) de la línea
 * vertical de un row completo — para dibujar el <line> del row en SVG.
 */
export function getRowLineEndpoints(
  grid: Grid,
  rowNumber: number
): { bottom: PixelPoint; top: PixelPoint } {
  const x = grid.position.x + (rowNumber - 1) * ROW_SPACING;
  const bottomY = grid.position.y;
  const topY = grid.position.y - grid.bayColumns * BAY_HEIGHT;

  return {
    bottom: { x, y: bottomY },
    top: { x, y: topY },
  };
}

/**
 * Posición donde debe ir el número de row (sección 5: siempre en el
 * extremo inferior).
 */
export function getRowLabelPosition(grid: Grid, rowNumber: number): PixelPoint {
  const { bottom } = getRowLineEndpoints(grid, rowNumber);
  return { x: bottom.x, y: bottom.y + 20 };
}