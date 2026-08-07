import type { ProjectData } from "@/lib/storage/project-data";
import type {
  Block,
  Grid,
  Layout,
  MapObject,
  MapText,
  Orchard,
  Project,
  Row,
  Treatment,
  UUID,
  Vine,
} from "@/types";

export const LAYOUT_BACKUP_FORMAT = "layout-orchard" as const;
export const LAYOUT_BACKUP_VERSION = 1;

export interface LayoutBackupFile {
  format: typeof LAYOUT_BACKUP_FORMAT;
  version: typeof LAYOUT_BACKUP_VERSION;
  exportedAt: string;
  data: ProjectData;
}

export type LayoutBackupValidationResult =
  | { ok: true; backup: LayoutBackupFile }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateProject(value: unknown): value is Project {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.variety) &&
    isNonEmptyString(value.projectLeader) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.createdBy)
  );
}

function validateOrchard(value: unknown): value is Orchard {
  if (!isRecord(value)) return false;

  return isNonEmptyString(value.id) && isNonEmptyString(value.name);
}

function validateLayout(value: unknown): value is Layout {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.projectId) &&
    isNonEmptyString(value.orchardId) &&
    isStringArray(value.blockIds) &&
    (value.status === "draft" || value.status === "saved") &&
    isNonEmptyString(value.lastEditedBy) &&
    isNonEmptyString(value.lastEditedAt)
  );
}

function validateBlock(value: unknown): value is Block {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.orchardId) &&
    isNonEmptyString(value.name)
  );
}

function validateGrid(value: unknown): value is Grid {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.layoutId) &&
    isNonEmptyString(value.blockId) &&
    typeof value.order === "number" &&
    typeof value.rows === "number" &&
    typeof value.bayColumns === "number" &&
    Array.isArray(value.cells) &&
    isRecord(value.position) &&
    typeof value.position.x === "number" &&
    typeof value.position.y === "number" &&
    typeof value.rotation === "number" &&
    value.layer === 1
  );
}

function validateTreatment(value: unknown): value is Treatment {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.layoutId) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.labelName) &&
    isNonEmptyString(value.color) &&
    (value.color2 === undefined || typeof value.color2 === "string")
  );
}

function validateVine(value: unknown): value is Vine {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.gridId) &&
    typeof value.rowNumber === "number" &&
    typeof value.bayIndex === "number" &&
    (value.slot === 1 || value.slot === 2 || value.slot === 3) &&
    (value.gender === "male" || value.gender === "female") &&
    (value.treatmentId === null || typeof value.treatmentId === "string") &&
    (value.number === null || typeof value.number === "number") &&
    typeof value.layer === "number"
  );
}

function validateRow(value: unknown): value is Row {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.gridId) &&
    typeof value.index === "number"
  );
}

function validateMapObject(value: unknown): value is MapObject {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.layoutId) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    isNonEmptyString(value.name) &&
    (value.shape === "circle" ||
      value.shape === "square" ||
      value.shape === "triangle") &&
    isNonEmptyString(value.color) &&
    typeof value.size === "number"
  );
}

function validateMapText(value: unknown): value is MapText {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.layoutId) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    isNonEmptyString(value.text) &&
    typeof value.fontSize === "number"
  );
}

export function createLayoutBackup(data: ProjectData): LayoutBackupFile {
  return {
    format: LAYOUT_BACKUP_FORMAT,
    version: LAYOUT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      project: data.project,
      orchard: data.orchard,
      blocks: data.blocks,
      layout: data.layout,
      grids: data.grids,
      treatments: data.treatments ?? [],
      vines: data.vines ?? [],
      mapObjects: data.mapObjects ?? [],
      mapTexts: data.mapTexts ?? [],
      rows: data.rows ?? [],
    },
  };
}

export function validateLayoutBackup(
  parsed: unknown
): LayoutBackupValidationResult {
  if (!isRecord(parsed)) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  if (parsed.format !== LAYOUT_BACKUP_FORMAT) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  if (parsed.version !== LAYOUT_BACKUP_VERSION) {
    return {
      ok: false,
      message: "This backup version is not supported by this app.",
    };
  }

  if (!isRecord(parsed.data)) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  const data = parsed.data;

  if (
    !validateProject(data.project) ||
    !validateOrchard(data.orchard) ||
    !validateLayout(data.layout) ||
    !Array.isArray(data.blocks) ||
    !data.blocks.every(validateBlock) ||
    !Array.isArray(data.grids) ||
    !data.grids.every(validateGrid)
  ) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  try {
    const treatments = data.treatments;
    if (treatments !== undefined) {
      if (!Array.isArray(treatments) || !treatments.every(validateTreatment)) {
        return {
          ok: false,
          message: "This file is not a valid Layout Orchard backup.",
        };
      }
    }

    const vines = data.vines;
    if (vines !== undefined) {
      if (!Array.isArray(vines) || !vines.every(validateVine)) {
        return {
          ok: false,
          message: "This file is not a valid Layout Orchard backup.",
        };
      }
    }

    const rows = data.rows;
    if (rows !== undefined) {
      if (!Array.isArray(rows) || !rows.every(validateRow)) {
        return {
          ok: false,
          message: "This file is not a valid Layout Orchard backup.",
        };
      }
    }

    const mapObjects = data.mapObjects;
    if (mapObjects !== undefined) {
      if (!Array.isArray(mapObjects) || !mapObjects.every(validateMapObject)) {
        return {
          ok: false,
          message: "This file is not a valid Layout Orchard backup.",
        };
      }
    }

    const mapTexts = data.mapTexts;
    if (mapTexts !== undefined) {
      if (!Array.isArray(mapTexts) || !mapTexts.every(validateMapText)) {
        return {
          ok: false,
          message: "This file is not a valid Layout Orchard backup.",
        };
      }
    }
  } catch {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  const project = data.project as Project;
  const orchard = data.orchard as Orchard;
  const layout = data.layout as Layout;

  if (layout.projectId !== project.id || layout.orchardId !== orchard.id) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  const blockIds = new Set((data.blocks as Block[]).map((block) => block.id));
  if (!layout.blockIds.every((blockId) => blockIds.has(blockId))) {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }

  const gridIds = new Set((data.grids as Grid[]).map((grid) => grid.id));

  for (const vine of (data.vines as Vine[] | undefined) ?? []) {
    if (!gridIds.has(vine.gridId)) {
      return {
        ok: false,
        message: "This file is not a valid Layout Orchard backup.",
      };
    }
  }

  for (const row of (data.rows as Row[] | undefined) ?? []) {
    if (!gridIds.has(row.gridId)) {
      return {
        ok: false,
        message: "This file is not a valid Layout Orchard backup.",
      };
    }
  }

  const treatmentIds = new Set(
    ((data.treatments as Treatment[] | undefined) ?? []).map(
      (treatment) => treatment.id
    )
  );

  for (const vine of (data.vines as Vine[] | undefined) ?? []) {
    if (vine.treatmentId && !treatmentIds.has(vine.treatmentId)) {
      return {
        ok: false,
        message: "This file is not a valid Layout Orchard backup.",
      };
    }
  }

  return {
    ok: true,
    backup: {
      format: LAYOUT_BACKUP_FORMAT,
      version: LAYOUT_BACKUP_VERSION,
      exportedAt:
        typeof parsed.exportedAt === "string"
          ? parsed.exportedAt
          : new Date().toISOString(),
      data: {
        project,
        orchard,
        blocks: data.blocks as Block[],
        layout,
        grids: data.grids as Grid[],
        treatments: (data.treatments as Treatment[] | undefined) ?? [],
        vines: (data.vines as Vine[] | undefined) ?? [],
        mapObjects: (data.mapObjects as MapObject[] | undefined) ?? [],
        mapTexts: (data.mapTexts as MapText[] | undefined) ?? [],
        rows: (data.rows as Row[] | undefined) ?? [],
      },
    },
  };
}

export function parseLayoutBackupJson(text: string): LayoutBackupValidationResult {
  try {
    const parsed: unknown = JSON.parse(text);
    return validateLayoutBackup(parsed);
  } catch {
    return {
      ok: false,
      message: "This file is not a valid Layout Orchard backup.",
    };
  }
}

export function remapBackupToLayout(
  backup: ProjectData,
  targetLayoutId: UUID
): ProjectData {
  const layout: Layout = {
    ...backup.layout,
    id: targetLayoutId,
    projectId: backup.project.id,
    orchardId: backup.orchard.id,
    blockIds: backup.blocks.map((block) => block.id),
  };

  const blocks = backup.blocks.map((block) => ({
    ...block,
    orchardId: backup.orchard.id,
  }));

  const grids = backup.grids.map((grid) => ({
    ...grid,
    layoutId: targetLayoutId,
  }));

  const treatments = (backup.treatments ?? []).map((treatment) => ({
    ...treatment,
    layoutId: targetLayoutId,
  }));

  const mapObjects = (backup.mapObjects ?? []).map((object) => ({
    ...object,
    layoutId: targetLayoutId,
  }));

  const mapTexts = (backup.mapTexts ?? []).map((text) => ({
    ...text,
    layoutId: targetLayoutId,
  }));

  return {
    project: backup.project,
    orchard: backup.orchard,
    blocks,
    layout,
    grids,
    treatments,
    vines: backup.vines ?? [],
    mapObjects,
    mapTexts,
    rows: backup.rows ?? [],
  };
}

export function sanitizeBackupFilename(name: string): string {
  const trimmed = name.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
  const withoutExtension = trimmed.replace(/\.json$/i, "");
  return withoutExtension || "Layout backup";
}

export function downloadLayoutBackup(filename: string, backup: LayoutBackupFile) {
  const safeName = sanitizeBackupFilename(filename);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.json`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildProjectDataSnapshot(
  projectData: ProjectData,
  extras: {
    treatments: Treatment[];
    vines: Vine[];
    mapObjects: MapObject[];
    mapTexts: MapText[];
    rows: Row[];
  }
): ProjectData {
  return {
    ...projectData,
    treatments: extras.treatments,
    vines: extras.vines,
    mapObjects: extras.mapObjects,
    mapTexts: extras.mapTexts,
    rows: extras.rows,
  };
}
