import type { Grid, Vine } from "@/types";
import { bayToPixel } from "@/lib/grid-geometry";

const VINE_HIT_RADIUS = 12;

function numerableRowKey(gridId: string, rowNumber: number): string {
  return `${gridId}|${rowNumber}`;
}

/**
 * Rows that contain at least one vine with treatmentId !== null are numerable.
 * Rows with only untreated vines are buffer rows and are excluded from snake order.
 */
function buildNumerableRowIndexMap(
  vines: Vine[],
  grids: Grid[]
): Map<string, number> {
  const numerableRowIndexByKey = new Map<string, number>();
  let numerableIndex = 0;
  const gridsInOrder = [...grids].sort((a, b) => a.order - b.order);

  for (const grid of gridsInOrder) {
    const gridVines = vines.filter((vine) => vine.gridId === grid.id);
    const numerableRows = new Set<number>();

    gridVines.forEach((vine) => {
      if (vine.treatmentId !== null) {
        numerableRows.add(vine.rowNumber);
      }
    });

    [...numerableRows]
      .sort((rowA, rowB) => rowA - rowB)
      .forEach((rowNumber) => {
        numerableIndex += 1;
        numerableRowIndexByKey.set(
          numerableRowKey(grid.id, rowNumber),
          numerableIndex
        );
      });
  }

  return numerableRowIndexByKey;
}

function compareVinesInSnakeOrder(
  a: Vine,
  b: Vine,
  numerableRowIndexByKey: Map<string, number>
): number {
  const indexA = numerableRowIndexByKey.get(
    numerableRowKey(a.gridId, a.rowNumber)
  );
  const indexB = numerableRowIndexByKey.get(
    numerableRowKey(b.gridId, b.rowNumber)
  );

  if (indexA === undefined && indexB === undefined) {
    if (a.rowNumber !== b.rowNumber) {
      return a.rowNumber - b.rowNumber;
    }
    if (a.bayIndex !== b.bayIndex) {
      return a.bayIndex - b.bayIndex;
    }
    return a.slot - b.slot;
  }

  if (indexA === undefined) {
    return 1;
  }

  if (indexB === undefined) {
    return -1;
  }

  if (indexA !== indexB) {
    return indexA - indexB;
  }

  // Posición impar entre rows numerables → sube; par → baja.
  const isEvenNumerableRow = indexA % 2 === 0;
  const bayComparison = isEvenNumerableRow
    ? b.bayIndex - a.bayIndex
    : a.bayIndex - b.bayIndex;

  if (bayComparison !== 0) {
    return bayComparison;
  }

  return a.slot - b.slot;
}

/**
 * Determina el orden de recorrido "snake" (culebra) de las vines
 * dentro de un único Grid (sección 6).
 *
 * Orientación del grid: los Rows son líneas VERTICALES (eje Y),
 * numeradas de abajo hacia arriba. Los travesaños cruzan en el eje X,
 * perpendiculares a los rows. bayIndex representa la posición a lo largo
 * de un row (subiendo o bajando esa línea vertical), NO una fila horizontal.
 *
 * Buffer rows (sin ninguna vine con treatment) se ignoran por completo.
 * La dirección zigzag usa la posición de la row entre las rows numerables
 * del Layout, no rowNumber % 2.
 */
function sortVinesInGridSnakeOrder(
  gridVines: Vine[],
  numerableRowIndexByKey: Map<string, number>
): Vine[] {
  return [...gridVines].sort((a, b) =>
    compareVinesInSnakeOrder(a, b, numerableRowIndexByKey)
  );
}

/**
 * Recorre todos los Grids de un Layout en el orden definido por Grid.order
 * (sección 15), concatenando las vines de cada uno en orden snake.
 * Esto es lo que permite que el segundo Grid continúe la numeración
 * donde quedó el primero, en vez de reiniciar.
 */
function getAllVinesInSnakeOrder(vines: Vine[], grids: Grid[]): Vine[] {
  const numerableRowIndexByKey = buildNumerableRowIndexMap(vines, grids);
  const gridsInOrder = [...grids].sort((a, b) => a.order - b.order);

  return gridsInOrder.flatMap((grid) => {
    const vinesInThisGrid = vines.filter((vine) => vine.gridId === grid.id);
    return sortVinesInGridSnakeOrder(
      vinesInThisGrid,
      numerableRowIndexByKey
    );
  });
}

/**
 * Asigna numeración automática a todas las vines de un treatment específico,
 * recorriendo en snake a través de todos los Grids del Layout (sección 6 y 15).
 * La numeración es única POR TREATMENT, no global — por eso se filtra antes
 * de numerar, y las vines de otros treatments no interrumpen el conteo.
 *
 * Devuelve el arreglo completo de vines (con y sin cambios), para que sea
 * fácil de usar como reemplazo directo del estado existente.
 */
export function assignAutoSnakeNumbering(
  vines: Vine[],
  grids: Grid[],
  treatmentId: string
): Vine[] {
  const orderedVines = getAllVinesInSnakeOrder(vines, grids);

  const orderedVinesForTreatment = orderedVines.filter(
    (vine) => vine.treatmentId === treatmentId
  );

  const numberByVineId = new Map<string, number>();
  orderedVinesForTreatment.forEach((vine, index) => {
    numberByVineId.set(vine.id, index + 1);
  });

  return vines.map((vine) =>
    numberByVineId.has(vine.id)
      ? { ...vine, number: numberByVineId.get(vine.id)! }
      : vine
  );
}

/**
 * Asigna números snake solo a vines numerables que todavía tienen number === null.
 * Continúa la secuencia del Treatment desde el máximo existente + 1.
 */
export function assignAutoSnakeToUnnumbered(
  vines: Vine[],
  grids: Grid[],
  treatmentId: string
): Vine[] {
  const orderedVines = getAllVinesInSnakeOrder(vines, grids);
  const toNumber = orderedVines.filter(
    (vine) => vine.treatmentId === treatmentId && vine.number === null
  );

  if (toNumber.length === 0) {
    return vines;
  }

  let nextNumber = getMaxNumberForTreatment(vines, treatmentId) + 1;
  const numberByVineId = new Map<string, number>();

  toNumber.forEach((vine) => {
    numberByVineId.set(vine.id, nextNumber++);
  });

  return vines.map((vine) =>
    numberByVineId.has(vine.id)
      ? { ...vine, number: numberByVineId.get(vine.id)! }
      : vine
  );
}

/**
 * Auto-numera vines sin número para todos los Treatments presentes en el Layout.
 */
export function assignAutoSnakeToUnnumberedAllTreatments(
  vines: Vine[],
  grids: Grid[]
): Vine[] {
  const treatmentIds = [
    ...new Set(
      vines
        .filter((vine) => vine.treatmentId !== null)
        .map((vine) => vine.treatmentId as string)
    ),
  ];

  return treatmentIds.reduce(
    (current, treatmentId) =>
      assignAutoSnakeToUnnumbered(current, grids, treatmentId),
    vines
  );
}

/**
 * Descarta la numeración actual de un Treatment y recalcula desde 1 en orden snake.
 */
export function resetAndAssignAutoSnakeNumbering(
  vines: Vine[],
  grids: Grid[],
  treatmentId: string
): Vine[] {
  const cleared = vines.map((vine) =>
    vine.treatmentId === treatmentId ? { ...vine, number: null } : vine
  );

  return assignAutoSnakeNumbering(cleared, grids, treatmentId);
}

/**
 * Reset completo: recalcula la numeración snake de todos los Treatments.
 */
export function resetAndAssignAutoSnakeAllTreatments(
  vines: Vine[],
  grids: Grid[]
): Vine[] {
  const treatmentIds = [
    ...new Set(
      vines
        .filter((vine) => vine.treatmentId !== null)
        .map((vine) => vine.treatmentId as string)
    ),
  ];

  let result = vines.map((vine) =>
    vine.treatmentId !== null ? { ...vine, number: null } : vine
  );

  for (const treatmentId of treatmentIds) {
    result = assignAutoSnakeNumbering(result, grids, treatmentId);
  }

  return result;
}

export function getMaxNumberForTreatment(
  vines: Vine[],
  treatmentId: string
): number {
  return vines.reduce((max, vine) => {
    if (vine.treatmentId !== treatmentId || vine.number === null) {
      return max;
    }
    return Math.max(max, vine.number);
  }, 0);
}

export function getNextNumberForTreatment(
  vines: Vine[],
  treatmentId: string
): number {
  return getMaxNumberForTreatment(vines, treatmentId) + 1;
}

export function findAllDuplicateVineIds(vines: Vine[]): Set<string> {
  const treatmentIds = new Set(
    vines
      .filter((vine) => vine.treatmentId !== null)
      .map((vine) => vine.treatmentId as string)
  );

  const duplicateIds = new Set<string>();
  treatmentIds.forEach((treatmentId) => {
    findDuplicateNumbersInTreatment(vines, treatmentId).forEach((id) =>
      duplicateIds.add(id)
    );
  });

  return duplicateIds;
}

export function findVineAtPoint(
  vines: Vine[],
  grids: Grid[],
  point: { x: number; y: number }
): Vine | null {
  const gridById = new Map(grids.map((grid) => [grid.id, grid]));
  const vinesByBayKey = new Map<string, Vine[]>();

  vines.forEach((vine) => {
    const key = `${vine.gridId}|${vine.rowNumber}|${vine.bayIndex}`;
    vinesByBayKey.set(key, [...(vinesByBayKey.get(key) ?? []), vine]);
  });

  let closest: { vine: Vine; distance: number } | null = null;

  for (const vine of vines) {
    const grid = gridById.get(vine.gridId);
    if (!grid) continue;

    const bayKey = `${vine.gridId}|${vine.rowNumber}|${vine.bayIndex}`;
    const vinesInSameBay = vinesByBayKey.get(bayKey) ?? [vine];
    const pixel = bayToPixel(
      grid,
      vine.rowNumber,
      vine.bayIndex,
      vine.slot,
      vinesInSameBay
    );
    const distance = Math.hypot(pixel.x - point.x, pixel.y - point.y);

    if (
      distance <= VINE_HIT_RADIUS &&
      (!closest || distance < closest.distance)
    ) {
      closest = { vine, distance };
    }
  }

  return closest?.vine ?? null;
}

export function layoutHasNumbering(vines: Vine[]): boolean {
  return vines.some((vine) => vine.number !== null);
}

/**
 * Valida que la numeración dentro de un treatment sea única.
 * Sección 6: verde si es único, rojo si está duplicado dentro de su treatment.
 * Devuelve el set de IDs de vines que tienen un número DUPLICADO
 * (para que la UI las pinte en rojo).
 */
export function findDuplicateNumbersInTreatment(
  vines: Vine[],
  treatmentId: string
): Set<string> {
  const vinesInTreatment = vines.filter(
    (vine) => vine.treatmentId === treatmentId && vine.number !== null
  );

  const countByNumber = new Map<number, string[]>();
  vinesInTreatment.forEach((vine) => {
    const existing = countByNumber.get(vine.number!) ?? [];
    countByNumber.set(vine.number!, [...existing, vine.id]);
  });

  const duplicateIds = new Set<string>();
  countByNumber.forEach((vineIds) => {
    if (vineIds.length > 1) {
      vineIds.forEach((id) => duplicateIds.add(id));
    }
  });

  return duplicateIds;
}

// ─── Validación de colisiones físicas (slot ocupado) ───
// "Ese caso no debería poder darse": esto es PREVENCIÓN, no solo detección.
// Se usa ANTES de insertar una vine nueva (en el flujo de long-press,
// sección 4), para bloquear el guardado si el slot ya está ocupado.

/**
 * Devuelve true si ya existe una vine en ese gridId + rowNumber + bayIndex + slot.
 * Se llama antes de crear una vine nueva. Si mode === "edit", pasar
 * excludeVineId para no chocar contra la propia vine que se está editando.
 */
export function isSlotOccupied(
  vines: Vine[],
  gridId: string,
  rowNumber: number,
  bayIndex: number,
  slot: 1 | 2 | 3,
  excludeVineId?: string
): boolean {
  return vines.some(
    (vine) =>
      vine.gridId === gridId &&
      vine.rowNumber === rowNumber &&
      vine.bayIndex === bayIndex &&
      vine.slot === slot &&
      vine.id !== excludeVineId
  );
}

/**
 * Chequeo de sanidad sobre datos ya existentes (por ejemplo, mock-data,
 * o datos importados): agrupa vines que comparten
 * gridId + rowNumber + bayIndex + slot, algo que NUNCA debería pasar
 * si isSlotOccupied() se usó correctamente al crear cada vine.
 * Útil para detectar corrupción de datos o bugs, no para el flujo normal.
 */
export function findSlotCollisions(vines: Vine[]): Vine[][] {
  const groups = new Map<string, Vine[]>();

  vines.forEach((vine) => {
    const key = `${vine.gridId}|${vine.rowNumber}|${vine.bayIndex}|${vine.slot}`;
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, vine]);
  });

  return Array.from(groups.values()).filter((group) => group.length > 1);
}