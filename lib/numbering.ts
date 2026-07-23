import type { Grid, Vine } from "@/types";

/**
 * Determina el orden de recorrido "snake" (culebra) de las vines
 * dentro de un único Grid (sección 6).
 *
 * Orientación del grid: los Rows son líneas VERTICALES (eje Y),
 * numeradas de abajo hacia arriba. Los travesaños cruzan en el eje X,
 * perpendiculares a los rows. bayIndex representa la posición a lo largo
 * de un row (subiendo o bajando esa línea vertical), NO una fila horizontal.
 *
 * El recorrido snake entonces es: subir el Row 1 completo (bayIndex
 * ascendente), cruzar al Row 2 y bajarlo (bayIndex descendente), cruzar
 * al Row 3 y volver a subir, y así sucesivamente.
 * Dentro de un mismo bay, las vines se ordenan por slot ascendente.
 */
function sortVinesInGridSnakeOrder(gridVines: Vine[]): Vine[] {
  return [...gridVines].sort((a, b) => {
    if (a.rowNumber !== b.rowNumber) {
      return a.rowNumber - b.rowNumber;
    }

    // Row impar (1, 3, 5...) → sube (bayIndex ascendente).
    // Row par (2, 4, 6...) → baja (bayIndex descendente).
    const isEvenRow = a.rowNumber % 2 === 0;
    const bayComparison = isEvenRow
      ? b.bayIndex - a.bayIndex
      : a.bayIndex - b.bayIndex;

    if (bayComparison !== 0) {
      return bayComparison;
    }

    return a.slot - b.slot;
  });
}

/**
 * Recorre todos los Grids de un Layout en el orden definido por Grid.order
 * (sección 15), concatenando las vines de cada uno en orden snake.
 * Esto es lo que permite que el segundo Grid continúe la numeración
 * donde quedó el primero, en vez de reiniciar.
 */
function getAllVinesInSnakeOrder(vines: Vine[], grids: Grid[]): Vine[] {
  const gridsInOrder = [...grids].sort((a, b) => a.order - b.order);

  return gridsInOrder.flatMap((grid) => {
    const vinesInThisGrid = vines.filter((vine) => vine.gridId === grid.id);
    return sortVinesInGridSnakeOrder(vinesInThisGrid);
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