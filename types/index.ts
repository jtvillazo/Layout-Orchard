type UUID = string;

// ─── Orchard / Block (catálogo reutilizable — sección 15) ───

interface Orchard {
  id: UUID;
  name: string;
  location?: string;
  address?: string;
}

interface Block {
  id: UUID;
  orchardId: UUID;
  name: string;
}

// ─── Project ───

interface Project {
  id: UUID;
  name: string;
  blockIds: UUID[];
  variety: string;
  projectLeader: string;
  orchardId: UUID; // se replica a todo el layout (sección 3)
  createdAt: string;
  createdBy: string; // username simple, sección 11
}

// ─── Layout (faltaba: es la entidad que la app realmente dibuja) ───
// 1 Layout por Project, sin versionado (sección 2 y 12)

interface Layout {
  id: UUID;
  projectId: UUID;
  status: "draft" | "saved"; // para el autosave de emergencia (sección 12)
  lastEditedBy: string;
  lastEditedAt: string;
}

interface GridCell {
  aisleIndex: number;
  bayIndex: number;
  zoneColor?: string;
}

// ─── Row ───
// El número de row NO se autogenera por posición: se asigna tocando
// el extremo inferior (sección 5). Por eso separamos índice físico vs. label.

interface Row {
  id: UUID;
  gridId: UUID;
  index: number; // posición física dentro del grid, 1 a rows
  label: string | null; // número que el usuario asignó tocando el extremo; null = sin asignar
}

// ─── Treatment ───

interface Treatment {
  id: UUID;
  layoutId: UUID; // los treatments viven dentro de un layout, no son globales
  name: string;
  labelName: string;
  color: string;
  comment?: string;
}

// ─── Usuario (login simple, sección 11) ───

interface User {
  username: string; // sin password, solo trazabilidad
}

// ─── Base compartida por todo elemento dibujable del layout ───
// (sección 9: grid=1 fijo, contenido=2 por defecto, y se puede subir)

interface LayoutElement {
  layer: number;
}

// ─── Grid ───
// Layer 1, fija — el grid siempre es la capa base (sección 9)

interface Grid extends LayoutElement {
  id: UUID;
  layoutId: UUID;
  blockId: UUID;
  order: number;
  rows: number;
  bayColumns: number;
  cells: GridCell[];
  position: { x: number; y: number };
  rotation: number;
  layer: 1; // literal fijo: nunca cambia, a diferencia del resto
}

// ─── Vine ───

interface Vine extends LayoutElement {
  id: UUID;
  gridId: UUID;
  rowNumber: number;
  bayIndex: number;
  slot: 1 | 2 | 3; // posición final, usada por la geometría para dibujar
  slotPosition?: "start" | "middle" | "end"; // solo si se creó como 3ra vine; registra la intención original del usuario, no se recalcula después
  gender: "male" | "female";
  treatmentId: UUID | null;
  number: number | null;
  comment?: string;
  // layer: number — heredado de LayoutElement, default 2
}

// ─── Objeto ───

type PredefinedObjectIcon =
  | "camera"
  | "sensor"
  | "water"
  | "toilet"
  | "entrance"
  | "other";

interface MapObject extends LayoutElement {
  id: UUID;
  layoutId: UUID;
  kind: "icon" | "shape";
  icon?: PredefinedObjectIcon;
  shape?: "square" | "rectangle" | "circle";
  color?: string;
  text?: string;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  // layer: number — heredado, default 2
}

// ─── Texto libre ───

interface MapText extends LayoutElement {
  id: UUID;
  layoutId: UUID;
  content: string;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  // layer: number — heredado, default 2
}

// ─── Modo global del Layout ───

type LayoutMode = "readonly" | "edit";

// ─── Herramienta activa dentro de modo EDIT (sección 3) ───

type EditTool =
  | "none"
  | "createGrid"
  | "createVine" // long-press sobre línea de grid
  | "createObject"
  | "createText"
  | "select" // selección múltiple
  | "numbering"; // Modo Numeración (etapa 2, sección 6)

// ─── Selección múltiple (sección 10) ───
// Alcance MVP: solo permite eliminar en lote

interface SelectionState {
  active: boolean;
  selectedIds: UUID[];
  selectedType: "vine" | "object" | "text" | null; // homogéneo: no se mezclan tipos en una selección
}

// ─── Modo Numeración (sección 6) ───
// Flujo: se elige un treatment, se recorre en snake automático,
// y el usuario puede sobreescribir con tap (+1) o long-press (reset a 0)

interface NumberingModeState {
  active: boolean;
  treatmentId: UUID | null; // la numeración es por treatment, nunca global
  counter: number; // valor que se asigna al próximo tap
  autoSnakeApplied: boolean; // si ya se corrió el algoritmo automático para este treatment
}

// ─── Popup de crear/editar vine (sección 4) ───
// Un solo click corto = editar/eliminar; long-press = crear nueva

interface VineEditorPopupState {
  open: boolean;
  mode: "create" | "edit";
  gridId: UUID;
  rowNumber: number;
  bayIndex: number;
  targetSlot?: 1 | 2 | 3; // si mode === "create" y ya hay 2 vines, elegir posición del 3ro
  existingVineId?: UUID; // si mode === "edit"
}

// ─── Estado global del editor (agrupa todo lo anterior) ───

interface LayoutEditorState {
  mode: LayoutMode;
  activeTool: EditTool;
  selection: SelectionState;
  numbering: NumberingModeState;
  vinePopup: VineEditorPopupState | null;
  currentUser: string; // login simple, sección 11
}

export type {
  UUID,
  Orchard,
  Block,
  Project,
  Layout,
  GridCell,
  Row,
  Treatment,
  User,
  LayoutElement,
  Grid,
  Vine,
  PredefinedObjectIcon,
  MapObject,
  MapText,
  LayoutMode,
  EditTool,
  SelectionState,
  NumberingModeState,
  VineEditorPopupState,
  LayoutEditorState,
};