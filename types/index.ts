type UUID = string;

interface Orchard {
  id: UUID;
  name: string;
  location?: string; // zona/región general, ej: "Bay of Plenty"
  address?: string;  // dirección física concreta
}

interface Block {
  id: UUID;
  orchardId: UUID;
  name: string; // ej: "Block C"
}

interface Project {
  id: UUID;
  name: string;
  blockIds: UUID[];
  variety: string;       // ej: "Hayward", "Gold"
  projectLeader: string; // nombre de quien lidera el estudio
  createdAt: string;     // se genera solo, no lo tipea el usuario
}

interface Grid {
    id: UUID;
    projectId: UUID;
    rows: number;        // cantidad de líneas de árboles (rows), ej: 4
    bayColumns: number;  // segmentos a lo largo de cada row
    cells: GridCell[];   // los cuadrados de bay, para dibujar el grid y zonas de color
    position: { x: number; y: number };
    rotation: number;
  }
  
  interface GridCell {
    aisleIndex: number; // entre qué par de rows (1 a rows-1)
    bayIndex: number;   // qué segmento a lo largo (1 a bayColumns)
    zoneColor?: string;
  }
  
  interface Vine {
    id: UUID;
    gridId: UUID;
    rowNumber: number;  // en qué row específica vive (1 a rows) — no "entre rows"
    bayIndex: number;   // en qué segmento a lo largo de esa row
    slot: 1 | 2 | 3;    // cuál de las hasta 3 posiciones en ese punto
    gender: "male" | "female";
    treatmentId: UUID | null;
    number: string | null;
    comment?: string;
    labelName: string | null;
  }
