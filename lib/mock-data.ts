import type {
  Orchard,
  Block,
  Project,
  Layout,
  Grid,
  Row,
  Treatment,
  Vine,
  MapObject,
  MapText,
} from "@/types";

// ─── Orchard / Block ───

export const mockOrchard: Orchard = {
  id: "orchard-1",
  name: "Te Puke Orchard",
  location: "Bay of Plenty",
  address: "123 Kiwi Rd, Te Puke",
};

export const mockBlock: Block = {
  id: "block-1",
  orchardId: "orchard-1",
  name: "Block C",
};

// ─── Project ───

export const mockProject: Project = {
  id: "project-1",
  name: "Ensayo Fertilizante X — Temporada 2026",
  blockIds: ["block-1"],
  variety: "Hayward",
  projectLeader: "Ana Rodríguez",
  orchardId: "orchard-1",
  createdAt: "2026-06-01T09:00:00Z",
  createdBy: "ana.rodriguez",
};

// ─── Layout ───

export const mockLayout: Layout = {
  id: "layout-1",
  projectId: "project-1",
  status: "saved",
  lastEditedBy: "ana.rodriguez",
  lastEditedAt: "2026-07-20T14:30:00Z",
};

// ─── Grids ───
// Grid 1 y Grid 2 en el mismo Layout (mismo Block, dos zonas del ensayo)
// El order define cuál se numera primero (sección 15)

export const mockGrid1: Grid = {
  id: "grid-1",
  layoutId: "layout-1",
  blockId: "block-1",
  order: 1,
  rows: 3,
  bayColumns: 4,
  cells: [],
  position: { x: 0, y: 0 },
  rotation: 0,
  layer: 1,
};

export const mockGrid2: Grid = {
  id: "grid-2",
  layoutId: "layout-1",
  blockId: "block-1",
  order: 2,
  rows: 2,
  bayColumns: 3,
  cells: [],
  position: { x: 600, y: 0 }, // separado espacialmente en el canvas
  rotation: 0,
  layer: 1,
};

// ─── Rows ───
// Numeración asignada tocando el extremo inferior (sección 5)
// Nota: row.index es la posición física; row.label es lo que el usuario tocó y asignó

export const mockRows: Row[] = [
  { id: "row-1a", gridId: "grid-1", index: 1, label: "1" },
  { id: "row-1b", gridId: "grid-1", index: 2, label: "2" },
  { id: "row-1c", gridId: "grid-1", index: 3, label: "3" },
  { id: "row-2a", gridId: "grid-2", index: 1, label: "4" },
  { id: "row-2b", gridId: "grid-2", index: 2, label: "5" },
];

// ─── Treatments ───

export const mockTreatments: Treatment[] = [
  {
    id: "treatment-control",
    layoutId: "layout-1",
    name: "Control",
    labelName: "CTRL",
    color: "#9CA3AF",
    comment: "Sin aplicación",
  },
  {
    id: "treatment-a",
    layoutId: "layout-1",
    name: "Fertilizante X - Dosis Alta",
    labelName: "FX-A",
    color: "#22C55E",
  },
  {
    id: "treatment-b",
    layoutId: "layout-1",
    name: "Fertilizante X - Dosis Baja",
    labelName: "FX-B",
    color: "#3B82F6",
  },
];

// ─── Vines ───
// Mezcla de casos: bay con 2 vines normales, un bay con 3 (con slotPosition),
// una vine sin treatment (no tratada = default), y numeración ya asignada
// para mostrar la continuidad snake entre Grid 1 y Grid 2 (mismo Treatment)

export const mockVines: Vine[] = [
  // Grid 1, Row 1 (label "1"), bay 1 — 2 vines, Treatment A
  {
    id: "vine-1",
    gridId: "grid-1",
    rowNumber: 1,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: 1,
    layer: 2,
  },
  {
    id: "vine-2",
    gridId: "grid-1",
    rowNumber: 1,
    bayIndex: 1,
    slot: 2,
    gender: "male",
    treatmentId: "treatment-a",
    number: 2,
    layer: 2,
  },
  // Grid 1, Row 1, bay 2 — 3 vines (caso especial, sección 4)
  {
    id: "vine-3",
    gridId: "grid-1",
    rowNumber: 1,
    bayIndex: 2,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: 3,
    layer: 2,
  },
  {
    id: "vine-4",
    gridId: "grid-1",
    rowNumber: 1,
    bayIndex: 2,
    slot: 2,
    gender: "female",
    treatmentId: "treatment-a",
    number: 4,
    layer: 2,
  },
  {
    id: "vine-5",
    gridId: "grid-1",
    rowNumber: 1,
    bayIndex: 2,
    slot: 3,
    slotPosition: "middle",
    gender: "male",
    treatmentId: "treatment-a",
    number: 5,
    layer: 2,
  },
  // Grid 1, Row 2 — Treatment Control
  {
    id: "vine-6",
    gridId: "grid-1",
    rowNumber: 2,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-control",
    number: 1,
    layer: 2,
  },
  {
    id: "vine-7",
    gridId: "grid-1",
    rowNumber: 2,
    bayIndex: 1,
    slot: 2,
    gender: "male",
    treatmentId: "treatment-control",
    number: 2,
    layer: 2,
  },
  // Grid 1, Row 3 — vine no tratada (default), sin comment ni número aún
  {
    id: "vine-8",
    gridId: "grid-1",
    rowNumber: 3,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: null,
    number: null,
    comment: "Marcada para revisar en terreno",
    layer: 2,
  },
  // Grid 2, Row 1 (label "4") — Treatment A, continúa la numeración (6, 7)
  // en vez de reiniciar en 1 (sección 15)
  {
    id: "vine-9",
    gridId: "grid-2",
    rowNumber: 1,
    bayIndex: 1,
    slot: 1,
    gender: "female",
    treatmentId: "treatment-a",
    number: 6,
    layer: 2,
  },
  {
    id: "vine-10",
    gridId: "grid-2",
    rowNumber: 1,
    bayIndex: 1,
    slot: 2,
    gender: "male",
    treatmentId: "treatment-a",
    number: 7,
    layer: 2,
  },
];

// ─── Objeto ───

export const mockObjects: MapObject[] = [
  {
    id: "object-1",
    layoutId: "layout-1",
    kind: "icon",
    icon: "water",
    position: { x: -50, y: 100 },
    rotation: 0,
    scale: 1,
    layer: 3, // subida de capa para resolver superposición con el grid
  },
];

// ─── Texto ───

export const mockTexts: MapText[] = [
  {
    id: "text-1",
    layoutId: "layout-1",
    content: "Entrada principal ↓",
    position: { x: 0, y: -40 },
    rotation: 0,
    scale: 1,
    layer: 2,
  },
];
