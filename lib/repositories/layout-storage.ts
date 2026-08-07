import {
  deleteAllByIndex,
  deleteById,
  getAllByIndex,
  getById,
  getStore,
  putAll,
  replaceByIndex,
  runTransaction,
} from "@/lib/db/database";
import { STORES } from "@/lib/db/schema";
import type { ProjectData } from "@/lib/storage/project-data";
import { remapBackupToLayout } from "@/lib/layout-backup";
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

const ALL_STORES = Object.values(STORES);

async function getBlocksForLayout(
  blocksStore: IDBObjectStore,
  layout: Layout
): Promise<Block[]> {
  const blocks = await Promise.all(
    layout.blockIds.map((blockId) => getById<Block>(blocksStore, blockId))
  );

  return blocks.filter((block): block is Block => block !== undefined);
}

async function getGridsForLayout(
  gridsStore: IDBObjectStore,
  layoutId: UUID
): Promise<Grid[]> {
  return getAllByIndex<Grid>(gridsStore, "layoutId", layoutId);
}

async function getVinesForGridIds(
  vinesStore: IDBObjectStore,
  gridIds: UUID[]
): Promise<Vine[]> {
  const vinesByGrid = await Promise.all(
    gridIds.map((gridId) => getAllByIndex<Vine>(vinesStore, "gridId", gridId))
  );

  return vinesByGrid.flat();
}

async function getRowsForGridIds(
  rowsStore: IDBObjectStore,
  gridIds: UUID[]
): Promise<Row[]> {
  const rowsByGrid = await Promise.all(
    gridIds.map((gridId) => getAllByIndex<Row>(rowsStore, "gridId", gridId))
  );

  return rowsByGrid.flat();
}

async function assembleProjectDataFromLayout(
  transaction: IDBTransaction,
  layout: Layout
): Promise<ProjectData | null> {
  const projectsStore = getStore(transaction, STORES.projects);
  const orchardsStore = getStore(transaction, STORES.orchards);
  const blocksStore = getStore(transaction, STORES.blocks);
  const gridsStore = getStore(transaction, STORES.grids);
  const vinesStore = getStore(transaction, STORES.vines);
  const treatmentsStore = getStore(transaction, STORES.treatments);
  const mapObjectsStore = getStore(transaction, STORES.mapObjects);
  const mapTextsStore = getStore(transaction, STORES.mapTexts);
  const rowsStore = getStore(transaction, STORES.rows);

  const project = await getById<Project>(projectsStore, layout.projectId);
  const orchard = await getById<Orchard>(orchardsStore, layout.orchardId);

  if (!project || !orchard) {
    return null;
  }

  const blocks = await getBlocksForLayout(blocksStore, layout);
  const grids = await getGridsForLayout(gridsStore, layout.id);
  const gridIds = grids.map((grid) => grid.id);
  const vines = await getVinesForGridIds(vinesStore, gridIds);
  const treatments = await getAllByIndex<Treatment>(
    treatmentsStore,
    "layoutId",
    layout.id
  );
  const mapObjects = await getAllByIndex<MapObject>(
    mapObjectsStore,
    "layoutId",
    layout.id
  );
  const mapTexts = await getAllByIndex<MapText>(
    mapTextsStore,
    "layoutId",
    layout.id
  );
  const rows = await getRowsForGridIds(rowsStore, gridIds);

  return {
    project,
    orchard,
    blocks,
    layout,
    grids,
    treatments,
    vines,
    mapObjects,
    mapTexts,
    rows,
  };
}

async function replaceVinesForLayout(
  transaction: IDBTransaction,
  layoutId: UUID,
  vines: Vine[]
): Promise<void> {
  const gridsStore = getStore(transaction, STORES.grids);
  const vinesStore = getStore(transaction, STORES.vines);
  const grids = await getGridsForLayout(gridsStore, layoutId);

  await Promise.all(
    grids.map((grid) => deleteAllByIndex(vinesStore, "gridId", grid.id))
  );

  await putAll(vinesStore, vines);
}

async function replaceRowsForLayout(
  transaction: IDBTransaction,
  layoutId: UUID,
  rows: Row[]
): Promise<void> {
  const gridsStore = getStore(transaction, STORES.grids);
  const rowsStore = getStore(transaction, STORES.rows);
  const grids = await getGridsForLayout(gridsStore, layoutId);

  await Promise.all(
    grids.map((grid) => deleteAllByIndex(rowsStore, "gridId", grid.id))
  );

  await putAll(rowsStore, rows);
}

async function touchLayoutEditedAt(
  layoutsStore: IDBObjectStore,
  layout: Layout
): Promise<Layout> {
  const updatedLayout: Layout = {
    ...layout,
    lastEditedAt: new Date().toISOString(),
  };

  await putAll(layoutsStore, [updatedLayout]);
  return updatedLayout;
}

async function finalizeLayoutWrite(
  transaction: IDBTransaction,
  layoutId: UUID
): Promise<ProjectData | null> {
  const layoutsStore = getStore(transaction, STORES.layouts);
  const layout = await getById<Layout>(layoutsStore, layoutId);

  if (!layout) {
    return null;
  }

  const updatedLayout = await touchLayoutEditedAt(layoutsStore, layout);
  return assembleProjectDataFromLayout(transaction, updatedLayout);
}

export async function createProjectData(data: ProjectData): Promise<ProjectData> {
  await runTransaction(
    [
      STORES.projects,
      STORES.orchards,
      STORES.blocks,
      STORES.layouts,
      STORES.grids,
      STORES.vines,
      STORES.treatments,
      STORES.mapObjects,
      STORES.mapTexts,
      STORES.rows,
    ],
    "readwrite",
    async (transaction) => {
      await putAll(getStore(transaction, STORES.projects), [data.project]);
      await putAll(getStore(transaction, STORES.orchards), [data.orchard]);
      await putAll(getStore(transaction, STORES.blocks), data.blocks);
      await putAll(getStore(transaction, STORES.layouts), [data.layout]);

      if (data.grids.length > 0) {
        await putAll(getStore(transaction, STORES.grids), data.grids);
      }

      if (data.treatments && data.treatments.length > 0) {
        await putAll(getStore(transaction, STORES.treatments), data.treatments);
      }

      if (data.vines && data.vines.length > 0) {
        await putAll(getStore(transaction, STORES.vines), data.vines);
      }

      if (data.mapObjects && data.mapObjects.length > 0) {
        await putAll(getStore(transaction, STORES.mapObjects), data.mapObjects);
      }

      if (data.mapTexts && data.mapTexts.length > 0) {
        await putAll(getStore(transaction, STORES.mapTexts), data.mapTexts);
      }

      if (data.rows && data.rows.length > 0) {
        await putAll(getStore(transaction, STORES.rows), data.rows);
      }
    }
  );

  return data;
}

export async function getProjectData(
  projectId: UUID
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readonly", async (transaction) => {
    const project = await getById<Project>(
      getStore(transaction, STORES.projects),
      projectId
    );

    if (!project) {
      return null;
    }

    const layouts = await getAllByIndex<Layout>(
      getStore(transaction, STORES.layouts),
      "projectId",
      projectId
    );
    const layout = layouts[0];

    if (!layout) {
      return null;
    }

    return assembleProjectDataFromLayout(transaction, layout);
  });
}

export async function getLayoutData(
  layoutId: UUID
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readonly", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    return assembleProjectDataFromLayout(transaction, layout);
  });
}

export async function getAllProjects(): Promise<ProjectData[]> {
  return runTransaction(ALL_STORES, "readonly", async (transaction) => {
    const projectsStore = getStore(transaction, STORES.projects);
    const layoutsStore = getStore(transaction, STORES.layouts);
    const projects = await new Promise<Project[]>((resolve, reject) => {
      const request = projectsStore.getAll();
      request.onsuccess = () => resolve(request.result as Project[]);
      request.onerror = () => reject(request.error);
    });

    const bundles = await Promise.all(
      projects.map(async (project) => {
        const layouts = await getAllByIndex<Layout>(
          layoutsStore,
          "projectId",
          project.id
        );
        const layout = layouts[0];

        if (!layout) {
          return null;
        }

        return assembleProjectDataFromLayout(transaction, layout);
      })
    );

    return bundles.filter((bundle): bundle is ProjectData => bundle !== null);
  });
}

export async function addGridToLayout(
  layoutId: UUID,
  grid: Grid,
  rows: Row[] = []
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await putAll(getStore(transaction, STORES.grids), [grid]);

    if (rows.length > 0) {
      await putAll(getStore(transaction, STORES.rows), rows);
    }

    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutTreatments(
  layoutId: UUID,
  treatments: Treatment[]
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await replaceByIndex(
      getStore(transaction, STORES.treatments),
      "layoutId",
      layoutId,
      treatments
    );

    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutVines(
  layoutId: UUID,
  vines: Vine[]
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await replaceVinesForLayout(transaction, layoutId, vines);
    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutMapObjects(
  layoutId: UUID,
  mapObjects: MapObject[]
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await replaceByIndex(
      getStore(transaction, STORES.mapObjects),
      "layoutId",
      layoutId,
      mapObjects
    );

    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutMapTexts(
  layoutId: UUID,
  mapTexts: MapText[]
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await replaceByIndex(
      getStore(transaction, STORES.mapTexts),
      "layoutId",
      layoutId,
      mapTexts
    );

    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutRows(
  layoutId: UUID,
  rows: Row[]
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layout = await getById<Layout>(
      getStore(transaction, STORES.layouts),
      layoutId
    );

    if (!layout) {
      return null;
    }

    await replaceRowsForLayout(transaction, layoutId, rows);
    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function updateLayoutMetadata(
  layoutId: UUID,
  updates: {
    project: Project;
    orchard: Orchard;
    blocks: Block[];
  }
): Promise<ProjectData | null> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layoutsStore = getStore(transaction, STORES.layouts);
    const blocksStore = getStore(transaction, STORES.blocks);
    const gridsStore = getStore(transaction, STORES.grids);
    const layout = await getById<Layout>(layoutsStore, layoutId);

    if (!layout) {
      return null;
    }

    const grids = await getGridsForLayout(gridsStore, layoutId);
    const gridBlockIds = new Set(grids.map((grid) => grid.blockId));
    const updatedBlockIds = new Set(updates.blocks.map((block) => block.id));

    const existingBlocks = await getAllByIndex<Block>(
      blocksStore,
      "orchardId",
      layout.orchardId
    );

    for (const block of existingBlocks) {
      if (updatedBlockIds.has(block.id)) {
        continue;
      }

      if (gridBlockIds.has(block.id)) {
        continue;
      }

      await deleteById(blocksStore, block.id);
    }

    await putAll(getStore(transaction, STORES.projects), [updates.project]);
    await putAll(getStore(transaction, STORES.orchards), [updates.orchard]);
    await putAll(blocksStore, updates.blocks);

    const updatedLayout: Layout = {
      ...layout,
      blockIds: updates.blocks.map((block) => block.id),
    };

    await putAll(layoutsStore, [updatedLayout]);
    return finalizeLayoutWrite(transaction, layoutId);
  });
}

export async function importLayoutBackup(
  targetLayoutId: UUID,
  backup: ProjectData
): Promise<ProjectData | null> {
  const imported = remapBackupToLayout(backup, targetLayoutId);

  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layoutsStore = getStore(transaction, STORES.layouts);
    const existingLayout = await getById<Layout>(layoutsStore, targetLayoutId);

    if (!existingLayout) {
      return null;
    }

    const gridsStore = getStore(transaction, STORES.grids);
    const vinesStore = getStore(transaction, STORES.vines);
    const rowsStore = getStore(transaction, STORES.rows);
    const treatmentsStore = getStore(transaction, STORES.treatments);
    const mapObjectsStore = getStore(transaction, STORES.mapObjects);
    const mapTextsStore = getStore(transaction, STORES.mapTexts);
    const blocksStore = getStore(transaction, STORES.blocks);
    const projectsStore = getStore(transaction, STORES.projects);
    const orchardsStore = getStore(transaction, STORES.orchards);

    const existingGrids = await getGridsForLayout(gridsStore, targetLayoutId);

    await Promise.all(
      existingGrids.map(async (grid) => {
        await deleteAllByIndex(vinesStore, "gridId", grid.id);
        await deleteAllByIndex(rowsStore, "gridId", grid.id);
        await deleteById(gridsStore, grid.id);
      })
    );

    await deleteAllByIndex(treatmentsStore, "layoutId", targetLayoutId);
    await deleteAllByIndex(mapObjectsStore, "layoutId", targetLayoutId);
    await deleteAllByIndex(mapTextsStore, "layoutId", targetLayoutId);

    await Promise.all(
      existingLayout.blockIds.map((blockId) => deleteById(blocksStore, blockId))
    );

    await deleteById(projectsStore, existingLayout.projectId);
    await deleteById(orchardsStore, existingLayout.orchardId);
    await deleteById(layoutsStore, targetLayoutId);

    await putAll(projectsStore, [imported.project]);
    await putAll(orchardsStore, [imported.orchard]);
    await putAll(blocksStore, imported.blocks);
    await putAll(layoutsStore, [imported.layout]);

    if (imported.grids.length > 0) {
      await putAll(gridsStore, imported.grids);
    }

    if (imported.treatments && imported.treatments.length > 0) {
      await putAll(treatmentsStore, imported.treatments);
    }

    if (imported.vines && imported.vines.length > 0) {
      await putAll(vinesStore, imported.vines);
    }

    if (imported.mapObjects && imported.mapObjects.length > 0) {
      await putAll(mapObjectsStore, imported.mapObjects);
    }

    if (imported.mapTexts && imported.mapTexts.length > 0) {
      await putAll(mapTextsStore, imported.mapTexts);
    }

    if (imported.rows && imported.rows.length > 0) {
      await putAll(rowsStore, imported.rows);
    }

    return assembleProjectDataFromLayout(transaction, imported.layout);
  });
}

/**
 * Deletes a layout and all entities belonging to its ProjectData bundle.
 * Current model: 1 project + 1 orchard + 1 layout per record.
 */
export async function deleteLayout(layoutId: UUID): Promise<boolean> {
  return runTransaction(ALL_STORES, "readwrite", async (transaction) => {
    const layoutsStore = getStore(transaction, STORES.layouts);
    const layout = await getById<Layout>(layoutsStore, layoutId);

    if (!layout) {
      return false;
    }

    const gridsStore = getStore(transaction, STORES.grids);
    const vinesStore = getStore(transaction, STORES.vines);
    const rowsStore = getStore(transaction, STORES.rows);
    const treatmentsStore = getStore(transaction, STORES.treatments);
    const mapObjectsStore = getStore(transaction, STORES.mapObjects);
    const mapTextsStore = getStore(transaction, STORES.mapTexts);
    const blocksStore = getStore(transaction, STORES.blocks);
    const projectsStore = getStore(transaction, STORES.projects);
    const orchardsStore = getStore(transaction, STORES.orchards);

    const grids = await getGridsForLayout(gridsStore, layoutId);

    await Promise.all(
      grids.map(async (grid) => {
        await deleteAllByIndex(vinesStore, "gridId", grid.id);
        await deleteAllByIndex(rowsStore, "gridId", grid.id);
        await deleteById(gridsStore, grid.id);
      })
    );

    await deleteAllByIndex(treatmentsStore, "layoutId", layoutId);
    await deleteAllByIndex(mapObjectsStore, "layoutId", layoutId);
    await deleteAllByIndex(mapTextsStore, "layoutId", layoutId);

    await Promise.all(
      layout.blockIds.map((blockId) => deleteById(blocksStore, blockId))
    );

    await deleteById(layoutsStore, layoutId);
    await deleteById(projectsStore, layout.projectId);
    await deleteById(orchardsStore, layout.orchardId);

    return true;
  });
}
