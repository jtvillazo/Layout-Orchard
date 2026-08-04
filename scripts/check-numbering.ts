import {
  assignAutoSnakeNumbering,
  findSlotCollisions,
} from "../lib/numbering";
import {
  mockVines,
  mockGrid1,
  mockGrid2,
} from "../lib/mock-data";

console.log("── Chequeo 1: colisiones de slot ──");
const collisions = findSlotCollisions(mockVines);
console.log("Colisiones encontradas:", collisions.length);
console.log(collisions.length === 0 ? "✅ OK, sin colisiones" : "❌ Hay colisiones:");
if (collisions.length > 0) console.log(JSON.stringify(collisions, null, 2));

console.log("\n── Chequeo 2: numeración automática snake (treatment-a) ──");
const result = assignAutoSnakeNumbering(
  mockVines,
  [mockGrid1, mockGrid2],
  "treatment-a"
);

const summary = result
  .filter((v) => v.treatmentId === "treatment-a")
  .map((v) => ({ id: v.id, number: v.number }));

console.log("Resultado:", summary);

const expected = [
  { id: "vine-1", number: 1 },
  { id: "vine-2", number: 2 },
  { id: "vine-3", number: 3 },
  { id: "vine-4", number: 4 },
  { id: "vine-5", number: 5 },
  { id: "vine-9", number: 6 },
  { id: "vine-10", number: 7 },
];

const matches = JSON.stringify(summary) === JSON.stringify(expected);
console.log(matches ? "✅ OK, coincide con lo esperado" : "❌ No coincide con lo esperado");
console.log("Esperado:", expected);

console.log("\n── Chequeo 3: buffer rows ignoradas en zigzag ──");
const bufferGrid: typeof mockGrid1 = {
  ...mockGrid1,
  id: "grid-buffer-test",
  rows: 4,
  bayColumns: 2,
};

const bufferVines: typeof mockVines = [
  {
    id: "buf-1",
    gridId: "grid-buffer-test",
    rowNumber: 1,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
  {
    id: "buf-2",
    gridId: "grid-buffer-test",
    rowNumber: 2,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
  {
    id: "buf-3",
    gridId: "grid-buffer-test",
    rowNumber: 3,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: null,
    number: null,
    layer: 2,
  },
  {
    id: "buf-4a",
    gridId: "grid-buffer-test",
    rowNumber: 4,
    bayIndex: 2,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
  {
    id: "buf-4b",
    gridId: "grid-buffer-test",
    rowNumber: 4,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
];

const bufferResult = assignAutoSnakeNumbering(
  bufferVines,
  [bufferGrid],
  "treatment-a"
);

const bufferSummary = bufferResult
  .filter((vine) => vine.treatmentId === "treatment-a")
  .map((vine) => ({
    id: vine.id,
    rowNumber: vine.rowNumber,
    bayIndex: vine.bayIndex,
    number: vine.number,
  }))
  .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

console.log("Resultado:", bufferSummary);

const bufferExpected = [
  { id: "buf-1", rowNumber: 1, bayIndex: 1, number: 1 },
  { id: "buf-2", rowNumber: 2, bayIndex: 1, number: 2 },
  { id: "buf-4b", rowNumber: 4, bayIndex: 1, number: 3 },
  { id: "buf-4a", rowNumber: 4, bayIndex: 2, number: 4 },
];

const bufferMatches =
  JSON.stringify(bufferSummary) === JSON.stringify(bufferExpected);
console.log(
  bufferMatches
    ? "✅ OK, row 3 ignorada y row 4 sigue zigzag impar (abajo→arriba)"
    : "❌ Buffer row / zigzag incorrecto"
);
console.log("Esperado:", bufferExpected);

console.log("\n── Chequeo 4: buffer rows entre múltiples grids ──");
const gridA: typeof mockGrid1 = {
  ...mockGrid1,
  id: "grid-a",
  order: 1,
  rows: 3,
  bayColumns: 1,
  position: { x: 0, y: 0 },
};

const gridB: typeof mockGrid2 = {
  ...mockGrid2,
  id: "grid-b",
  order: 2,
  rows: 2,
  bayColumns: 2,
  position: { x: 600, y: 0 },
};

const multiGridVines: typeof mockVines = [
  {
    id: "mg-1",
    gridId: "grid-a",
    rowNumber: 1,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
  {
    id: "mg-buffer",
    gridId: "grid-a",
    rowNumber: 2,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: null,
    number: null,
    layer: 2,
  },
  {
    id: "mg-2-top",
    gridId: "grid-b",
    rowNumber: 1,
    bayIndex: 2,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
  {
    id: "mg-2-bottom",
    gridId: "grid-b",
    rowNumber: 1,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: null,
    layer: 2,
  },
];

const multiGridResult = assignAutoSnakeNumbering(
  multiGridVines,
  [gridA, gridB],
  "treatment-a"
);

const multiGridSummary = multiGridResult
  .filter((vine) => vine.treatmentId === "treatment-a")
  .map((vine) => ({
    id: vine.id,
    bayIndex: vine.bayIndex,
    number: vine.number,
  }))
  .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

const multiGridExpected = [
  { id: "mg-1", bayIndex: 1, number: 1 },
  { id: "mg-2-top", bayIndex: 2, number: 2 },
  { id: "mg-2-bottom", bayIndex: 1, number: 3 },
];

const multiGridMatches =
  JSON.stringify(multiGridSummary) === JSON.stringify(multiGridExpected);
console.log("Resultado:", multiGridSummary);
console.log(
  multiGridMatches
    ? "✅ OK, buffer row en grid 1 no altera zigzag en grid 2"
    : "❌ Multi-grid buffer row incorrecto"
);
console.log("Esperado:", multiGridExpected);
