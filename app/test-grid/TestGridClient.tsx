"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  addGridToLayout,
  getAllProjects,
  getLayoutData,
  ProjectData,
  updateLayoutMapObjects,
  updateLayoutMapTexts,
  updateLayoutRows,
  updateLayoutTreatments,
  updateLayoutVines,
} from "@/lib/project-store";

import {
  EditTool,
  Grid,
  MapObject,
  MapText,
  Row,
  Treatment,
  UUID,
  Vine,
} from "@/types";

import { createId } from "@/lib/create-id";
import { AppHeader } from "@/components/app/AppHeader";
import { Canvas, type CanvasDragIntent } from "@/components/layout-editor/Canvas";
import { EditObjectModal, type MapObjectFormFields } from "@/components/layout-editor/EditObjectModal";
import { EditRowNumberModal } from "@/components/layout-editor/EditRowNumberModal";
import { EditTextModal, type MapTextFormFields } from "@/components/layout-editor/EditTextModal";
import { EditVineModal, type VineEditableFields } from "@/components/layout-editor/EditVineModal";
import { GridView } from "@/components/layout-editor/GridView";
import { MapObjectView } from "@/components/layout-editor/MapObjectView";
import { MapTextView } from "@/components/layout-editor/MapTextView";
import { ScreenContextPopup } from "@/components/layout-editor/ScreenContextPopup";
import { TreatmentModal } from "@/components/layout-editor/TreatmentModal";
import {
  ImportTreatmentsModal,
  type ImportLayoutOption,
} from "@/components/layout-editor/ImportTreatmentsModal";
import { TreatmentsMenu } from "@/components/layout-editor/TreatmentsMenu";
import { ToolsMenu } from "@/components/layout-editor/ToolsMenu";
import { bayToPixel, computeNextGridPosition, pixelToBay } from "@/lib/grid-geometry";
import type { PixelPoint } from "@/lib/grid-geometry";
import {
  DEFAULT_LONG_PRESS_MS,
  findObjectAtPoint,
  findTextAtPoint,
  MAP_ELEMENT_LONG_PRESS_MS,
} from "@/lib/map-elements";
import { normalizeMapObjects, normalizeMapTexts } from "@/lib/map-normalize";
import {
  createRowsForGrid,
  ensureLayoutRows,
  estimateCanvasUiScale,
  findRowHandleAtPoint,
  getGridRowDisplayNumbers,
  getRowHandleHitRadiusContent,
  isCompactRowHandleViewport,
  updateRowDisplayNumber,
} from "@/lib/row-numbers";
import { getFirstAvailableSlot } from "@/lib/vine-slots";
import {
  cloneTreatmentsForLayout,
  countVinesByTreatmentId,
  countVinesForTreatment,
  getLayoutTreatments,
} from "@/lib/treatment-utils";
import {
  assignAutoSnakeToUnnumberedAllTreatments,
  findAllDuplicateVineIds,
  findVineAtPoint,
  getNextNumberForTreatment,
  layoutHasNumbering,
  resetAndAssignAutoSnakeAllTreatments,
} from "@/lib/numbering";

export function TestGridClient() {
  const searchParams = useSearchParams();
  const layoutId = searchParams.get("layoutId");

  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  const [showCreateGrid, setShowCreateGrid] = useState(false);

  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [rows, setRows] = useState("10");
  const [bayColumns, setBayColumns] = useState("10");

  // Vines del layout actual
  const [vines, setVines] = useState<Vine[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [selectedVineId, setSelectedVineId] = useState<UUID | null>(null);
  const [editingVineId, setEditingVineId] = useState<UUID | null>(null);
  const [selectedTreatmentMenuId, setSelectedTreatmentMenuId] =
    useState<UUID | null>(null);
  const [treatmentModalState, setTreatmentModalState] = useState<
    | { mode: "create" }
    | { mode: "edit"; treatment: Treatment }
    | null
  >(null);
  const [deleteTreatmentWarning, setDeleteTreatmentWarning] = useState<{
    treatmentName: string;
    count: number;
  } | null>(null);
  const [showImportTreatments, setShowImportTreatments] = useState(false);
  const [activeTool, setActiveTool] = useState<EditTool>("none");
  const [mapObjects, setMapObjects] = useState<MapObject[]>([]);
  const [mapTexts, setMapTexts] = useState<MapText[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<UUID | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<UUID | null>(null);
  const [objectModalState, setObjectModalState] = useState<
    | { mode: "create"; position: PixelPoint }
    | { mode: "edit"; objectId: UUID }
    | null
  >(null);
  const [textModalState, setTextModalState] = useState<
    | { mode: "create"; position: PixelPoint }
    | { mode: "edit"; textId: UUID }
    | null
  >(null);
  const [layoutRows, setLayoutRows] = useState<Row[]>([]);
  const [rowNumberModalState, setRowNumberModalState] = useState<{
    gridId: UUID;
    rowNumber: number;
  } | null>(null);
  const draggingElementRef = useRef<{
    kind: "object" | "text";
    id: UUID;
  } | null>(null);
  const mapObjectsRef = useRef(mapObjects);
  const mapTextsRef = useRef(mapTexts);
  const layoutRowsRef = useRef(layoutRows);
  mapObjectsRef.current = mapObjects;
  mapTextsRef.current = mapTexts;
  layoutRowsRef.current = layoutRows;
  const [layoutLoadState, setLayoutLoadState] = useState<
    "idle" | "loading" | "ready" | "not-found"
  >("idle");
  const [importProjects, setImportProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    if (!layoutId) {
      setLayoutLoadState("not-found");
      return;
    }

    let cancelled = false;

    const activeLayoutId = layoutId;

    async function loadLayout() {
      setLayoutLoadState("loading");

      try {
        const data = await getLayoutData(activeLayoutId);

        if (cancelled) {
          return;
        }

        if (data) {
          const grids = data.grids ?? [];
          setProjectData({
            ...data,
            grids,
          });

          setTreatments(data.treatments ?? []);
          setVines(data.vines ?? []);
          setMapObjects(normalizeMapObjects(data.mapObjects ?? []));
          setMapTexts(normalizeMapTexts(data.mapTexts ?? []));
          setLayoutRows(ensureLayoutRows(grids, data.rows ?? []));
          setLayoutLoadState("ready");
          return;
        }

        setLayoutLoadState("not-found");
      } catch (error) {
        console.error("[layout] Failed to load layout from storage", error);
        if (!cancelled) {
          setLayoutLoadState("not-found");
        }
      }
    }

    void loadLayout();

    return () => {
      cancelled = true;
    };
  }, [layoutId]);

  useEffect(() => {
    if (!layoutId) {
      setImportProjects([]);
      return;
    }

    let cancelled = false;

    void getAllProjects()
      .then((projects) => {
        if (!cancelled) {
          setImportProjects(projects);
        }
      })
      .catch((error) => {
        console.error("[layout] Failed to load projects for import", error);
      });

    return () => {
      cancelled = true;
    };
  }, [layoutId]);

  if (layoutLoadState === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f6f2]">
        <AppHeader variant="edit" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Loading layout...</p>
        </main>
      </div>
    );
  }

  if (layoutLoadState === "not-found") {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f6f2]">
        <AppHeader variant="edit" />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="max-w-sm text-center text-sm text-gray-500">
            Layout not found. The project may not have been saved correctly.
          </p>
        </main>
      </div>
    );
  }

  if (!projectData) {
    return null;
  }

  async function handleCreateGrid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectData || !layoutId || !selectedBlockId) {
      return;
    }

    const newGrid: Grid = {
      id: createId(),
      layoutId,
      blockId: selectedBlockId as UUID,
      order: projectData.grids.length + 1,
      rows: Number(rows),
      bayColumns: Number(bayColumns),
      cells: [],
      position: computeNextGridPosition(projectData.grids),
      rotation: 0,
      layer: 1,
    };

    const newGridRows = createRowsForGrid(newGrid.id, Number(rows), createId);
    const existingRows = ensureLayoutRows(
      projectData.grids ?? [],
      layoutRowsRef.current
    );
    const nextRows = [...existingRows, ...newGridRows];
    const saved = await addGridToLayout(layoutId, newGrid, newGridRows);

    if (!saved) {
      return;
    }

    setLayoutRows(nextRows);
    setProjectData({
      ...saved,
      grids: saved.grids ?? [],
      rows: nextRows,
    });

    setShowCreateGrid(false);
  }

  async function persistRows(updatedRows: Row[]) {
    if (!layoutId) {
      return;
    }

    setLayoutRows(updatedRows);
    const saved = await updateLayoutRows(layoutId, updatedRows);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, rows: updatedRows } : current
      );
    }
  }

  function handleSaveRowDisplayNumber(displayNumber: number | null) {
    if (!rowNumberModalState) {
      return;
    }

    const updatedRows = updateRowDisplayNumber(
      layoutRowsRef.current,
      rowNumberModalState.gridId,
      rowNumberModalState.rowNumber,
      displayNumber
    );

    void persistRows(updatedRows);
    setRowNumberModalState(null);
  }

  function handleRowNumberHandleClick(gridId: UUID, rowNumber: number) {
    setRowNumberModalState({ gridId, rowNumber });
    setSelectedVineId(null);
    setSelectedObjectId(null);
    setSelectedTextId(null);
  }

  async function persistVines(updatedVines: Vine[]) {
    if (!layoutId) {
      return;
    }

    setVines(updatedVines);
    const saved = await updateLayoutVines(layoutId, updatedVines);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, vines: updatedVines } : current
      );
    }
  }

  async function persistMapObjects(updatedObjects: MapObject[]) {
    if (!layoutId) {
      return;
    }

    setMapObjects(updatedObjects);
    const saved = await updateLayoutMapObjects(layoutId, updatedObjects);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, mapObjects: updatedObjects } : current
      );
    }
  }

  async function persistMapTexts(updatedTexts: MapText[]) {
    if (!layoutId) {
      return;
    }

    setMapTexts(updatedTexts);
    const saved = await updateLayoutMapTexts(layoutId, updatedTexts);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, mapTexts: updatedTexts } : current
      );
    }
  }

  function handleCreateObject(fields: MapObjectFormFields, position: PixelPoint) {
    if (!layoutId) {
      return;
    }

    const newObject: MapObject = {
      id: createId(),
      layoutId,
      x: position.x,
      y: position.y,
      name: fields.name,
      shape: fields.shape,
      color: fields.color,
      size: fields.size,
      ...(fields.comment ? { comment: fields.comment } : {}),
    };

    persistMapObjects([...mapObjects, newObject]);
    setSelectedObjectId(newObject.id);
    setSelectedTextId(null);
    setSelectedVineId(null);
    setObjectModalState(null);
  }

  function handleSaveObject(objectId: UUID, fields: MapObjectFormFields) {
    persistMapObjects(
      mapObjects.map((object) =>
        object.id === objectId
          ? {
              ...object,
              name: fields.name,
              shape: fields.shape,
              color: fields.color,
              size: fields.size,
              comment: fields.comment,
            }
          : object
      )
    );
    setObjectModalState(null);
  }

  function handleDeleteObject(objectId: UUID) {
    persistMapObjects(mapObjects.filter((object) => object.id !== objectId));
    setSelectedObjectId(null);
    setObjectModalState(null);
  }

  function handleCreateText(fields: MapTextFormFields, position: PixelPoint) {
    if (!layoutId) {
      return;
    }

    const newText: MapText = {
      id: createId(),
      layoutId,
      x: position.x,
      y: position.y,
      text: fields.text,
      fontSize: fields.fontSize,
      ...(fields.comment ? { comment: fields.comment } : {}),
    };

    persistMapTexts([...mapTexts, newText]);
    setSelectedTextId(newText.id);
    setSelectedObjectId(null);
    setSelectedVineId(null);
    setTextModalState(null);
  }

  function handleSaveText(textId: UUID, fields: MapTextFormFields) {
    persistMapTexts(
      mapTexts.map((text) =>
        text.id === textId
          ? {
              ...text,
              text: fields.text,
              fontSize: fields.fontSize,
              comment: fields.comment,
            }
          : text
      )
    );
    setTextModalState(null);
  }

  function handleDeleteText(textId: UUID) {
    persistMapTexts(mapTexts.filter((text) => text.id !== textId));
    setSelectedTextId(null);
    setTextModalState(null);
  }

  function handleCreateVineAtBay(grid: Grid, rowNumber: number, bayIndex: number) {
    const vinesInBay = vines.filter(
      (vine) =>
        vine.gridId === grid.id &&
        vine.rowNumber === rowNumber &&
        vine.bayIndex === bayIndex
    );

    const slot = getFirstAvailableSlot(vinesInBay);
    if (slot === null) {
      console.log("[LONG PRESS] Bay lleno", {
        gridId: grid.id,
        rowNumber,
        bayIndex,
      });
      return;
    }

    const newVine: Vine = {
      id: createId(),
      gridId: grid.id,
      rowNumber,
      bayIndex,
      slot,
      gender: "female",
      treatmentId: null,
      number: null,
      layer: 2,
    };

    persistVines([...vines, newVine]);
  }

  function handleDeleteVine(vineId: UUID) {
    persistVines(vines.filter((vine) => vine.id !== vineId));
    setSelectedVineId(null);
  }

  function handleEditVine(vine: Vine) {
    setEditingVineId(vine.id);
    setSelectedVineId(null);
  }

  function handleSaveVine(vineId: UUID, updates: VineEditableFields) {
    const vine = vines.find((item) => item.id === vineId);
    if (!vine) {
      return;
    }

    const numberingUsed = layoutHasNumbering(vines);
    let number = vine.number;

    if (updates.treatmentId === null) {
      number = null;
    } else if (updates.treatmentId !== vine.treatmentId) {
      number = numberingUsed
        ? getNextNumberForTreatment(vines, updates.treatmentId)
        : null;
    } else if (
      updates.treatmentId &&
      vine.number === null &&
      numberingUsed
    ) {
      number = getNextNumberForTreatment(vines, updates.treatmentId);
    }

    persistVines(
      vines.map((item) =>
        item.id === vineId
          ? {
              ...item,
              gender: updates.gender,
              treatmentId: updates.treatmentId,
              comment: updates.comment,
              number,
            }
          : item
      )
    );
    setEditingVineId(null);
  }

  function handleToggleSelectTreatment(treatmentId: UUID) {
    setSelectedTreatmentMenuId((current) =>
      current === treatmentId ? null : treatmentId
    );
    setDeleteTreatmentWarning(null);
  }

  function handleSurfaceClick(
    target: Element | null,
    _clientX: number,
    _clientY: number,
    contentPoint: PixelPoint | null
  ) {
    if (target?.closest("[data-screen-context-popup]")) {
      return;
    }

    if (target?.closest("[data-layout-element-popup]")) {
      return;
    }

    if (target?.closest("[data-row-number-handle]")) {
      return;
    }

    if (activeTool === "createObject") {
      if (target?.closest("[data-map-object-id]")) {
        return;
      }
      setSelectedObjectId(null);
      setSelectedVineId(null);
      return;
    }

    if (activeTool === "createText") {
      if (target?.closest("[data-map-text-id]")) {
        return;
      }
      setSelectedTextId(null);
      setSelectedVineId(null);
      return;
    }

    if (activeTool === "numbering") {
      return;
    }

    if (target?.closest("[data-map-object-id]")) {
      return;
    }
    if (target?.closest("[data-map-text-id]")) {
      return;
    }
    if (!selectedVineId && !selectedObjectId && !selectedTextId) {
      return;
    }
    if (target?.closest("[data-vine-popup]")) return;
    if (target?.closest("[data-vine-id]")) return;

    setSelectedVineId(null);
    setSelectedObjectId(null);
    setSelectedTextId(null);
  }

  function handleSelectTool(tool: EditTool) {
    setSelectedVineId(null);
    setSelectedObjectId(null);
    setSelectedTextId(null);
    setObjectModalState(null);
    setTextModalState(null);
    setActiveTool(tool);

    if (tool === "numbering") {
      persistVines(assignAutoSnakeToUnnumberedAllTreatments(vines, grids));
    }
  }

  function handleNumberingTap(vine: Vine) {
    if (!vine.treatmentId) {
      return;
    }

    persistVines(
      vines.map((item) =>
        item.id === vine.id
          ? { ...item, number: (item.number ?? 0) + 1 }
          : item
      )
    );
  }

  function handleNumberingLongPress(vine: Vine) {
    if (!vine.treatmentId) {
      return;
    }

    persistVines(
      vines.map((item) =>
        item.id === vine.id ? { ...item, number: 1 } : item
      )
    );
  }

  function handleResetNumbering() {
    persistVines(resetAndAssignAutoSnakeAllTreatments(vines, grids));
  }

  function handleVineClick(vine: Vine) {
    if (activeTool === "createObject" || activeTool === "createText") {
      return;
    }

    if (activeTool === "numbering") {
      handleNumberingTap(vine);
      return;
    }

    setSelectedVineId(vine.id);
    setSelectedObjectId(null);
    setSelectedTextId(null);
  }

  function handleObjectClick(object: MapObject) {
    if (activeTool !== "createObject") {
      return;
    }

    setSelectedObjectId(object.id);
    setSelectedTextId(null);
    setSelectedVineId(null);
  }

  function handleTextClick(text: MapText) {
    if (activeTool !== "createText") {
      return;
    }

    setSelectedTextId(text.id);
    setSelectedObjectId(null);
    setSelectedVineId(null);
  }

  function beginObjectDrag(objectId: UUID) {
    draggingElementRef.current = { kind: "object", id: objectId };
    setSelectedObjectId(objectId);
    setSelectedTextId(null);
    setSelectedVineId(null);
  }

  function beginTextDrag(textId: UUID) {
    draggingElementRef.current = { kind: "text", id: textId };
    setSelectedTextId(textId);
    setSelectedObjectId(null);
    setSelectedVineId(null);
  }

  function tryBeginMapElementDragFromPoint(point: PixelPoint): boolean {
    const hitObject = findObjectAtPoint(mapObjectsRef.current, point);
    if (hitObject) {
      beginObjectDrag(hitObject.id);
      return true;
    }

    const hitText = findTextAtPoint(mapTextsRef.current, point);
    if (hitText) {
      beginTextDrag(hitText.id);
      return true;
    }

    return false;
  }

  function getMapElementLongPressDuration(point: PixelPoint | null) {
    if (!point) {
      return DEFAULT_LONG_PRESS_MS;
    }

    if (findObjectAtPoint(mapObjectsRef.current, point)) {
      return MAP_ELEMENT_LONG_PRESS_MS;
    }

    if (findTextAtPoint(mapTextsRef.current, point)) {
      return MAP_ELEMENT_LONG_PRESS_MS;
    }

    return DEFAULT_LONG_PRESS_MS;
  }

  function handleCanvasDragIntent(
    _target: Element | null,
    _clientX: number,
    _clientY: number,
    _contentPoint: PixelPoint | null
  ): CanvasDragIntent {
    if (draggingElementRef.current) {
      return "element";
    }

    return "pan";
  }

  function handleCanvasElementDrag(contentPoint: PixelPoint) {
    const dragging = draggingElementRef.current;
    if (!dragging) {
      return;
    }

    if (dragging.kind === "object") {
      const updatedObjects = mapObjectsRef.current.map((object) =>
        object.id === dragging.id
          ? { ...object, x: contentPoint.x, y: contentPoint.y }
          : object
      );
      mapObjectsRef.current = updatedObjects;
      setMapObjects(updatedObjects);
      return;
    }

    const updatedTexts = mapTextsRef.current.map((text) =>
      text.id === dragging.id
        ? { ...text, x: contentPoint.x, y: contentPoint.y }
        : text
    );
    mapTextsRef.current = updatedTexts;
    setMapTexts(updatedTexts);
  }

  function handleCanvasElementDragEnd() {
    const dragging = draggingElementRef.current;
    draggingElementRef.current = null;

    if (!dragging) {
      return;
    }

    if (dragging.kind === "object") {
      persistMapObjects(mapObjectsRef.current);
      if (activeTool !== "createObject") {
        setSelectedObjectId(null);
      }
      return;
    }

    persistMapTexts(mapTextsRef.current);
    if (activeTool !== "createText") {
      setSelectedTextId(null);
    }
  }

  const grids = projectData?.grids ?? [];
  const layoutTreatments = layoutId
    ? getLayoutTreatments(treatments, layoutId)
    : [];
  const layoutGridIds = new Set(grids.map((grid) => grid.id));
  const layoutVines = vines.filter((vine) => layoutGridIds.has(vine.gridId));
  const vineCountByTreatmentId = countVinesByTreatmentId(layoutVines);
  const numberingModeActive = activeTool === "numbering";
  const objectsModeActive = activeTool === "createObject";
  const textsModeActive = activeTool === "createText";
  const showNumberLabels = layoutHasNumbering(layoutVines);
  const duplicateVineIds = findAllDuplicateVineIds(layoutVines);

  function handleLongPress(
    _clientX: number,
    _clientY: number,
    point: PixelPoint | null
  ): boolean {
    if (!point) {
      return false;
    }

    if (
      findRowHandleAtPoint(
        grids,
        point,
        getRowHandleHitRadiusContent(
          estimateCanvasUiScale(),
          isCompactRowHandleViewport()
        )
      )
    ) {
      return false;
    }

    if (activeTool === "numbering") {
      const hitVine = findVineAtPoint(layoutVines, grids, point);
      if (hitVine) {
        handleNumberingLongPress(hitVine);
      }
      return false;
    }

    if (tryBeginMapElementDragFromPoint(point)) {
      return true;
    }

    if (activeTool === "createObject") {
      setSelectedObjectId(null);
      setSelectedVineId(null);
      setObjectModalState({ mode: "create", position: point });
      return false;
    }

    if (activeTool === "createText") {
      setSelectedObjectId(null);
      setSelectedTextId(null);
      setSelectedVineId(null);
      setTextModalState({ mode: "create", position: point });
      return false;
    }

    if (grids.length === 0) {
      return false;
    }

    for (const grid of grids) {
      const hit = pixelToBay(grid, point);
      if (hit) {
        handleCreateVineAtBay(grid, hit.rowNumber, hit.bayIndex);
        break;
      }
    }

    return false;
  }

  const importLayoutOptions: ImportLayoutOption[] = layoutId
    ? importProjects
        .filter((project) => project.layout.id !== layoutId)
        .map((project) => ({
          layoutId: project.layout.id,
          label: project.project.name,
          treatments: project.treatments ?? [],
        }))
    : [];

  async function persistTreatments(updatedTreatments: Treatment[]) {
    if (!layoutId) {
      return;
    }

    setTreatments(updatedTreatments);
    const saved = await updateLayoutTreatments(layoutId, updatedTreatments);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, treatments: updatedTreatments } : current
      );
    }
  }

  function handleAddTreatment(treatment: Treatment) {
    persistTreatments([...layoutTreatments, treatment]);
  }

  function handleSaveTreatment(treatment: Treatment) {
    const exists = layoutTreatments.some((item) => item.id === treatment.id);
    const updatedTreatments = exists
      ? layoutTreatments.map((item) =>
          item.id === treatment.id ? treatment : item
        )
      : [...layoutTreatments, treatment];

    persistTreatments(updatedTreatments);
    setTreatmentModalState(null);
  }

  function handleDeleteTreatment(treatment: Treatment) {
    const count = countVinesForTreatment(layoutVines, treatment.id);
    if (count > 0) {
      setDeleteTreatmentWarning({
        treatmentName: treatment.name,
        count,
      });
      setSelectedTreatmentMenuId(null);
      return;
    }

    persistTreatments(
      layoutTreatments.filter((item) => item.id !== treatment.id)
    );
    setSelectedTreatmentMenuId(null);
    setDeleteTreatmentWarning(null);
  }

  function handleImportTreatments(sourceTreatments: Treatment[]) {
    if (!layoutId || sourceTreatments.length === 0) {
      return;
    }

    const imported = cloneTreatmentsForLayout(
      sourceTreatments,
      layoutId,
      createId
    );
    persistTreatments([...layoutTreatments, ...imported]);
    setShowImportTreatments(false);
    setSelectedTreatmentMenuId(null);
    setDeleteTreatmentWarning(null);
  }
  const objectModalEditTarget =
    objectModalState?.mode === "edit"
      ? mapObjects.find((object) => object.id === objectModalState.objectId) ?? null
      : null;
  const selectedObject =
    mapObjects.find((object) => object.id === selectedObjectId) ?? null;
  const selectedText =
    mapTexts.find((text) => text.id === selectedTextId) ?? null;
  const editingText =
    textModalState?.mode === "edit"
      ? mapTexts.find((text) => text.id === textModalState.textId) ?? null
      : null;
  const editingVine = vines.find((vine) => vine.id === editingVineId) ?? null;
  const selectedVine = vines.find((vine) => vine.id === selectedVineId) ?? null;
  const selectedVineGrid = selectedVine
    ? grids.find((grid) => grid.id === selectedVine.gridId) ?? null
    : null;
  const selectedVineAnchor =
    selectedVine && selectedVineGrid
      ? bayToPixel(
          selectedVineGrid,
          selectedVine.rowNumber,
          selectedVine.bayIndex,
          selectedVine.slot,
          vines.filter(
            (vine) =>
              vine.gridId === selectedVine.gridId &&
              vine.rowNumber === selectedVine.rowNumber &&
              vine.bayIndex === selectedVine.bayIndex
          )
        )
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f2]">
      <AppHeader variant="edit" />

      <div className="relative min-h-0 flex-1">
      {/* Editor chrome: mobile-first grid, desktop absolute positioning.
          Wrappers use pointer-events-none so empty grid gaps do not block Canvas touch.
          Interactive panels re-enable pointer-events-auto on their own bounds. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 px-2 pt-2 sm:px-3 sm:pt-3 md:p-0">
        <div className="pointer-events-none grid grid-cols-[6.75rem_7.4rem] items-start justify-between gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:justify-normal sm:gap-3 md:block">
          <div className="pointer-events-none flex w-[6.75rem] min-w-0 flex-col gap-1.5 sm:w-auto sm:max-w-xs sm:gap-3 md:absolute md:left-8 md:top-8 md:w-44 md:max-w-none md:gap-3 lg:left-10 lg:top-10">
            <div className="pointer-events-auto rounded-lg bg-white p-1.5 shadow-md sm:rounded-xl sm:p-3 lg:p-4">
              <dl className="space-y-1 sm:space-y-2 lg:space-y-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
                  <dt className="font-medium text-gray-500 lg:mb-0">Leader</dt>
                  <dd className="truncate font-medium text-gray-800 lg:mt-0">
                    {projectData?.project.projectLeader}
                  </dd>
                </div>

                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
                  <dt className="font-medium text-gray-500 lg:mb-0">Project</dt>
                  <dd className="truncate font-semibold text-gray-800 lg:mt-0">
                    {projectData?.project.name}
                  </dd>
                </div>

                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
                  <dt className="font-medium text-gray-500 lg:mb-0">Orchard</dt>
                  <dd className="truncate font-medium text-gray-800 lg:mt-0">
                    {projectData?.orchard.name}
                  </dd>
                </div>
              </dl>
            </div>

            {layoutId && (
              <ToolsMenu
                activeTool={activeTool}
                onSelectTool={handleSelectTool}
                onCreateGrid={() => setShowCreateGrid(true)}
                className="pointer-events-auto"
              />
            )}
          </div>

          {layoutId && (
            <div className="pointer-events-auto w-[7.4rem] shrink-0 sm:w-44 md:absolute md:right-8 md:top-28 md:w-48 lg:right-10 lg:w-auto">
              <TreatmentsMenu
                treatments={layoutTreatments}
                vineCountByTreatmentId={vineCountByTreatmentId}
                selectedTreatmentId={selectedTreatmentMenuId}
                deleteWarning={deleteTreatmentWarning}
                onToggleSelectTreatment={handleToggleSelectTreatment}
                onDismissPopup={() => setSelectedTreatmentMenuId(null)}
                onDismissDeleteWarning={() => setDeleteTreatmentWarning(null)}
                onEditTreatment={(treatment) => {
                  setSelectedTreatmentMenuId(null);
                  setTreatmentModalState({ mode: "edit", treatment });
                }}
                onDeleteTreatment={handleDeleteTreatment}
                onCreateTreatment={() => {
                  setSelectedTreatmentMenuId(null);
                  setDeleteTreatmentWarning(null);
                  setTreatmentModalState({ mode: "create" });
                }}
                onImportTreatments={() => {
                  setSelectedTreatmentMenuId(null);
                  setDeleteTreatmentWarning(null);
                  setShowImportTreatments(true);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {numberingModeActive && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[#66806b]/10"
          aria-hidden="true"
        />
      )}

      {objectsModeActive && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[#3b82f6]/10"
          aria-hidden="true"
        />
      )}

      {textsModeActive && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[#a855f7]/10"
          aria-hidden="true"
        />
      )}

      {numberingModeActive && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-[#66806b]/30 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 md:max-w-[calc(100%-4rem)] lg:top-4">
          <p className="pointer-events-auto text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f4034] sm:text-xs sm:tracking-[0.18em]">
            Numbering Mode
          </p>
        </div>
      )}

      {objectsModeActive && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 md:max-w-[calc(100%-4rem)] lg:top-4">
          <p className="pointer-events-auto text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1e3a8a] sm:text-xs sm:tracking-[0.18em]">
            Objects Mode
          </p>
        </div>
      )}

      {textsModeActive && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-purple-200 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 md:max-w-[calc(100%-4rem)] lg:top-4">
          <p className="pointer-events-auto text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b21a8] sm:text-xs sm:tracking-[0.18em]">
            Texts Mode
          </p>
        </div>
      )}

      {numberingModeActive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-24">
          <button
            type="button"
            onClick={handleResetNumbering}
            className="pointer-events-auto max-w-sm rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm active:bg-amber-100 sm:px-4 sm:text-sm"
          >
            Reset numbers to default
          </button>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        onSurfaceClick={handleSurfaceClick}
        getDragIntent={handleCanvasDragIntent}
        onElementDrag={handleCanvasElementDrag}
        onElementDragEnd={handleCanvasElementDragEnd}
        onLongPress={handleLongPress}
        getLongPressDuration={getMapElementLongPressDuration}
        screenOverlay={
          <>
            {selectedObject && objectsModeActive && (
              <ScreenContextPopup
                anchorContentX={selectedObject.x}
                anchorContentY={selectedObject.y}
                layoutPopupAttribute="object"
                onEdit={() => {
                  setObjectModalState({ mode: "edit", objectId: selectedObject.id });
                  setSelectedObjectId(null);
                }}
                onDelete={() => handleDeleteObject(selectedObject.id)}
              />
            )}

            {selectedText && textsModeActive && (
              <ScreenContextPopup
                anchorContentX={selectedText.x}
                anchorContentY={selectedText.y}
                layoutPopupAttribute="text"
                onEdit={() => {
                  setTextModalState({ mode: "edit", textId: selectedText.id });
                  setSelectedTextId(null);
                }}
                onDelete={() => handleDeleteText(selectedText.id)}
              />
            )}

            {selectedVine &&
              selectedVineAnchor &&
              !numberingModeActive &&
              !objectsModeActive &&
              !textsModeActive && (
                <ScreenContextPopup
                  anchorContentX={selectedVineAnchor.x}
                  anchorContentY={selectedVineAnchor.y}
                  vinePopup
                  onEdit={() => handleEditVine(selectedVine)}
                  onDelete={() => handleDeleteVine(selectedVine.id)}
                />
              )}
          </>
        }
      >
        {grids.length > 0 ? (
          grids.map((grid) => (
            <GridView
              key={grid.id}
              grid={grid}
              vines={vines.filter((vine) => vine.gridId === grid.id)}
              treatments={treatments}
              rowDisplayNumbers={getGridRowDisplayNumbers(grid.id, layoutRows)}
              numberingMode={numberingModeActive}
              showNumberLabels={showNumberLabels}
              duplicateVineIds={duplicateVineIds}
              onVineClick={handleVineClick}
              onRowNumberHandleClick={(rowNumber) =>
                handleRowNumberHandleClick(grid.id, rowNumber)
              }
            />
          ))
        ) : (
          <g>
            <rect
              x="25"
              y="-45"
              width="450"
              height="170"
              rx="12"
              fill="#2f4034"
            />

            <text
              x="250"
              y="25"
              textAnchor="middle"
              fontSize="50"
              fontWeight="600"
              fill="white"
            >
              No grids created
            </text>

            <text
              x="250"
              y="75"
              textAnchor="middle"
              fontSize="40"
              fill="#DCE5DC"
            >
              Create a grid to start
            </text>
          </g>
        )}

        {mapObjects.map((object) => (
          <MapObjectView
            key={object.id}
            object={object}
            selected={selectedObjectId === object.id}
            onObjectClick={handleObjectClick}
          />
        ))}

        {mapTexts.map((text) => (
          <MapTextView
            key={text.id}
            text={text}
            selected={selectedTextId === text.id}
            onTextClick={handleTextClick}
          />
        ))}
      </Canvas>

      {objectModalState?.mode === "create" && (
        <EditObjectModal
          mode="create"
          onCancel={() => setObjectModalState(null)}
          onSave={(fields) =>
            handleCreateObject(fields, objectModalState.position)
          }
        />
      )}

      {objectModalState?.mode === "edit" && objectModalEditTarget && (
        <EditObjectModal
          mode="edit"
          initialValues={objectModalEditTarget}
          onCancel={() => setObjectModalState(null)}
          onSave={(fields) => handleSaveObject(objectModalEditTarget.id, fields)}
        />
      )}

      {textModalState?.mode === "create" && (
        <EditTextModal
          mode="create"
          onCancel={() => setTextModalState(null)}
          onSave={(fields) => handleCreateText(fields, textModalState.position)}
        />
      )}

      {textModalState?.mode === "edit" && editingText && (
        <EditTextModal
          mode="edit"
          initialValues={{
            text: editingText.text,
            fontSize: editingText.fontSize,
            comment: editingText.comment,
          }}
          onCancel={() => setTextModalState(null)}
          onSave={(fields) => handleSaveText(editingText.id, fields)}
        />
      )}

      {rowNumberModalState && (
        <EditRowNumberModal
          initialValue={
            layoutRows.find(
              (row) =>
                row.gridId === rowNumberModalState.gridId &&
                row.index === rowNumberModalState.rowNumber
            )?.displayNumber ?? null
          }
          onCancel={() => setRowNumberModalState(null)}
          onSave={handleSaveRowDisplayNumber}
        />
      )}

      {editingVine && layoutId && (
        <EditVineModal
          vine={editingVine}
          layoutId={layoutId}
          treatments={layoutTreatments}
          createId={createId}
          onCancel={() => setEditingVineId(null)}
          onSave={(updates) => handleSaveVine(editingVine.id, updates)}
          onAddTreatment={handleAddTreatment}
        />
      )}

      {treatmentModalState && layoutId && (
        <TreatmentModal
          layoutId={layoutId}
          mode={treatmentModalState.mode}
          treatment={
            treatmentModalState.mode === "edit"
              ? treatmentModalState.treatment
              : undefined
          }
          createId={createId}
          onCancel={() => setTreatmentModalState(null)}
          onSave={handleSaveTreatment}
        />
      )}

      {showImportTreatments && layoutId && (
        <ImportTreatmentsModal
          layoutOptions={importLayoutOptions}
          onCancel={() => setShowImportTreatments(false)}
          onImport={handleImportTreatments}
        />
      )}

      {/* Create Grid modal */}
      {showCreateGrid && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 p-5">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Create Grid
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose the block and define the grid dimensions.
              </p>
            </div>

            <form onSubmit={handleCreateGrid} className="space-y-5">
              {/* Block */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Block
                </span>

                <select
                  value={selectedBlockId}
                  onChange={(event) =>
                    setSelectedBlockId(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
                >
                  <option value="">
                    Select a block
                  </option>

                  {projectData?.blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Rows */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Rows
                </span>

                <input
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(event) => setRows(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
                />
              </label>

              {/* Bay columns */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Bay columns
                </span>

                <input
                  type="number"
                  min="1"
                  value={bayColumns}
                  onChange={(event) =>
                    setBayColumns(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
                />
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGrid(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white"
                >
                  Create Grid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}