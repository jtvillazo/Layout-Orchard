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
