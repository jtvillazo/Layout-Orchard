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
  updateLayoutTreatments,
  updateLayoutVines,
} from "@/lib/project-store";

import {
  EditTool,
  Grid,
  MapObject,
  MapText,
  PredefinedObjectIcon,
  Treatment,
  UUID,
  Vine,
} from "@/types";

function createId(): UUID {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

import { Canvas, type CanvasDragIntent } from "@/components/layout-editor/Canvas";
import { EditObjectModal, type MapObjectEditableFields } from "@/components/layout-editor/EditObjectModal";
import { EditTextModal } from "@/components/layout-editor/EditTextModal";
import { EditVineModal, type VineEditableFields } from "@/components/layout-editor/EditVineModal";
import { GridView } from "@/components/layout-editor/GridView";
import { LayoutElementContextPopup } from "@/components/layout-editor/LayoutElementContextPopup";
import { MapObjectView } from "@/components/layout-editor/MapObjectView";
import { MapTextView } from "@/components/layout-editor/MapTextView";
import { TreatmentModal } from "@/components/layout-editor/TreatmentModal";
import {
  ImportTreatmentsModal,
  type ImportLayoutOption,
} from "@/components/layout-editor/ImportTreatmentsModal";
import { TreatmentsMenu } from "@/components/layout-editor/TreatmentsMenu";
import { ToolsMenu } from "@/components/layout-editor/ToolsMenu";
import { VineContextPopup } from "@/components/layout-editor/VineContextPopup";
import { bayToPixel, computeNextGridPosition, pixelToBay } from "@/lib/grid-geometry";
import type { PixelPoint } from "@/lib/grid-geometry";
import {
  DEFAULT_OBJECT_TYPE,
  getObjectTypeDefinition,
} from "@/lib/object-types";
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
  const [selectedObjectType, setSelectedObjectType] =
    useState<PredefinedObjectIcon>(DEFAULT_OBJECT_TYPE);
  const [selectedObjectId, setSelectedObjectId] = useState<UUID | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<UUID | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<UUID | null>(null);
  const [textModalState, setTextModalState] = useState<
    | { mode: "create"; position: PixelPoint }
    | { mode: "edit"; textId: UUID }
    | null
  >(null);
  const draggingElementRef = useRef<{
    kind: "object" | "text";
    id: UUID;
  } | null>(null);
  const [layoutLoadState, setLayoutLoadState] = useState<
    "idle" | "loading" | "ready" | "not-found"
  >("idle");

  const rowLabels: Record<number, string> = {};

  useEffect(() => {
    if (!layoutId) {
      setLayoutLoadState("not-found");
      return;
    }

    setLayoutLoadState("loading");
    const data = getLayoutData(layoutId);

    if (data) {
      setProjectData({
        ...data,
        grids: data.grids ?? [],
      });

      setTreatments(data.treatments ?? []);
      setVines(data.vines ?? []);
      setMapObjects(data.mapObjects ?? []);
      setMapTexts(data.mapTexts ?? []);
      setLayoutLoadState("ready");
      return;
    }

    setLayoutLoadState("not-found");
  }, [layoutId]);

  if (layoutLoadState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading layout...</p>
      </main>
    );
  }

  if (layoutLoadState === "not-found") {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="max-w-sm text-center text-sm text-gray-500">
          Layout not found. The project may not have been saved correctly.
        </p>
      </main>
    );
  }

  if (!projectData) {
    return null;
  }

  function handleCreateGrid(event: FormEvent<HTMLFormElement>) {
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

    const updatedData = addGridToLayout(layoutId, newGrid);

    if (!updatedData) {
      return;
    }

    setProjectData({
      ...updatedData,
      grids: updatedData.grids ?? [],
    });

    setShowCreateGrid(false);
  }

  function persistVines(updatedVines: Vine[]) {
    if (!layoutId) {
      return;
    }

    setVines(updatedVines);
    const saved = updateLayoutVines(layoutId, updatedVines);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, vines: updatedVines } : current
      );
    }
  }

  function persistMapObjects(updatedObjects: MapObject[]) {
    if (!layoutId) {
      return;
    }

    setMapObjects(updatedObjects);
    const saved = updateLayoutMapObjects(layoutId, updatedObjects);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, mapObjects: updatedObjects } : current
      );
    }
  }

  function persistMapTexts(updatedTexts: MapText[]) {
    if (!layoutId) {
      return;
    }

    setMapTexts(updatedTexts);
    const saved = updateLayoutMapTexts(layoutId, updatedTexts);
    if (saved) {
      setProjectData((current) =>
        current ? { ...current, mapTexts: updatedTexts } : current
      );
    }
  }

  function handleCreateObjectAtPoint(point: PixelPoint) {
    if (!layoutId) {
      return;
    }

    const definition = getObjectTypeDefinition(selectedObjectType);
    const newObject: MapObject = {
      id: createId(),
      layoutId,
      kind: "icon",
      icon: selectedObjectType,
      text: definition.name,
      color: definition.placeholderColor,
      position: { x: point.x, y: point.y },
      rotation: 0,
      scale: 1,
      layer: 2,
    };

    persistMapObjects([...mapObjects, newObject]);
    setSelectedObjectId(newObject.id);
    setSelectedTextId(null);
    setSelectedVineId(null);
  }

  function handleDeleteObject(objectId: UUID) {
    persistMapObjects(mapObjects.filter((object) => object.id !== objectId));
    setSelectedObjectId(null);
    setEditingObjectId(null);
  }

  function handleSaveObject(objectId: UUID, updates: MapObjectEditableFields) {
    persistMapObjects(
      mapObjects.map((object) =>
        object.id === objectId
          ? {
              ...object,
              text: updates.name || undefined,
              icon: updates.icon,
              scale: updates.scale,
              color: updates.color,
            }
          : object
      )
    );
    setEditingObjectId(null);
  }

  function handleCreateText(content: string, position: PixelPoint) {
    if (!layoutId) {
      return;
    }

    const newText: MapText = {
      id: createId(),
      layoutId,
      content,
      position: { x: position.x, y: position.y },
      rotation: 0,
      scale: 1,
      layer: 2,
    };

    persistMapTexts([...mapTexts, newText]);
    setSelectedTextId(newText.id);
    setSelectedObjectId(null);
    setSelectedVineId(null);
    setTextModalState(null);
  }

  function handleSaveText(textId: UUID, content: string) {
    persistMapTexts(
      mapTexts.map((text) =>
        text.id === textId ? { ...text, content } : text
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
    if (target?.closest("[data-layout-element-popup]")) {
      return;
    }

    if (activeTool === "createObject") {
      if (target?.closest("[data-map-object-id]")) {
        return;
      }
      if (contentPoint) {
        handleCreateObjectAtPoint(contentPoint);
      }
      return;
    }

    if (activeTool === "createText") {
      if (target?.closest("[data-map-text-id]")) {
        return;
      }
      if (contentPoint) {
        setSelectedObjectId(null);
        setSelectedVineId(null);
        setTextModalState({ mode: "create", position: contentPoint });
      }
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
    setEditingObjectId(null);
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

  function handleCanvasDragIntent(
    target: Element | null,
    _clientX: number,
    _clientY: number,
    contentPoint: PixelPoint | null
  ): CanvasDragIntent {
    if (!contentPoint) {
      return "pan";
    }

    if (activeTool === "createObject") {
      const objectId = target
        ?.closest("[data-map-object-id]")
        ?.getAttribute("data-map-object-id");

      if (objectId) {
        draggingElementRef.current = { kind: "object", id: objectId };
        setSelectedObjectId(objectId);
        setSelectedTextId(null);
        setSelectedVineId(null);
        return "element";
      }
    }

    if (activeTool === "createText") {
      const textId = target
        ?.closest("[data-map-text-id]")
        ?.getAttribute("data-map-text-id");

      if (textId) {
        draggingElementRef.current = { kind: "text", id: textId };
        setSelectedTextId(textId);
        setSelectedObjectId(null);
        setSelectedVineId(null);
        return "element";
      }
    }

    return "pan";
  }

  function handleCanvasElementDrag(contentPoint: PixelPoint) {
    const dragging = draggingElementRef.current;
    if (!dragging) {
      return;
    }

    if (dragging.kind === "object") {
      persistMapObjects(
        mapObjects.map((object) =>
          object.id === dragging.id
            ? { ...object, position: { x: contentPoint.x, y: contentPoint.y } }
            : object
        )
      );
      return;
    }

    persistMapTexts(
      mapTexts.map((text) =>
        text.id === dragging.id
          ? { ...text, position: { x: contentPoint.x, y: contentPoint.y } }
          : text
      )
    );
  }

  function handleCanvasElementDragEnd() {
    draggingElementRef.current = null;
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
  const importLayoutOptions: ImportLayoutOption[] = layoutId
    ? getAllProjects()
        .filter((project) => project.layout.id !== layoutId)
        .map((project) => ({
          layoutId: project.layout.id,
          label: project.orchard.name,
          treatments: project.treatments ?? [],
        }))
    : [];

  function persistTreatments(updatedTreatments: Treatment[]) {
    if (!layoutId) {
      return;
    }

    setTreatments(updatedTreatments);
    const saved = updateLayoutTreatments(layoutId, updatedTreatments);
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
  const editingObject =
    mapObjects.find((object) => object.id === editingObjectId) ?? null;
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
    <div className="relative min-h-screen">
      {/* Editor chrome: mobile-first grid, desktop absolute positioning.
          Wrappers use pointer-events-none so empty grid gaps do not block Canvas touch.
          Interactive panels re-enable pointer-events-auto on their own bounds. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4">
        <div className="pointer-events-none grid grid-cols-[6.75rem_7.4rem] items-start justify-between gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:justify-normal sm:gap-3 lg:block">
          <div className="pointer-events-none flex w-[6.75rem] min-w-0 flex-col gap-1.5 sm:w-auto sm:max-w-xs sm:gap-3 md:max-w-sm lg:absolute lg:left-0 lg:top-0 lg:w-44 lg:max-w-none lg:gap-3">
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
                selectedObjectType={selectedObjectType}
                onSelectObjectType={setSelectedObjectType}
                className="pointer-events-auto"
              />
            )}
          </div>

          {layoutId && (
            <div className="pointer-events-auto w-[7.4rem] shrink-0 sm:w-44 md:w-48 lg:absolute lg:right-0 lg:top-28 lg:w-auto">
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
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-[#66806b]/30 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 lg:top-4">
          <p className="pointer-events-auto text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2f4034] sm:text-xs sm:tracking-[0.18em]">
            Numbering Mode
          </p>
        </div>
      )}

      {objectsModeActive && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 lg:top-4">
          <p className="pointer-events-auto text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1e3a8a] sm:text-xs sm:tracking-[0.18em]">
            Objects Mode
          </p>
        </div>
      )}

      {textsModeActive && (
        <div className="pointer-events-none absolute left-1/2 top-[7.5rem] z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border border-purple-200 bg-white/95 px-3 py-1.5 shadow-md sm:top-28 sm:px-4 sm:py-2 lg:top-4">
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
        onLongPress={(_clientX, _clientY, point) => {
          if (activeTool === "createObject" || activeTool === "createText") {
            return;
          }

          if (!point || grids.length === 0) {
            return;
          }

          if (numberingModeActive) {
            const hitVine = findVineAtPoint(layoutVines, grids, point);
            if (hitVine) {
              handleNumberingLongPress(hitVine);
            }
            return;
          }

          for (const grid of grids) {
            const hit = pixelToBay(grid, point);
            if (hit) {
              handleCreateVineAtBay(grid, hit.rowNumber, hit.bayIndex);
              return;
            }
          }
        }}
      >
        {grids.length > 0 ? (
          grids.map((grid) => (
            <GridView
              key={grid.id}
              grid={grid}
              vines={vines.filter((vine) => vine.gridId === grid.id)}
              treatments={treatments}
              rowLabels={rowLabels}
              numberingMode={numberingModeActive}
              showNumberLabels={showNumberLabels}
              duplicateVineIds={duplicateVineIds}
              onVineClick={handleVineClick}
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

        {selectedObject && objectsModeActive && (
          <LayoutElementContextPopup
            anchorX={selectedObject.position.x}
            anchorY={selectedObject.position.y}
            dataAttribute="object"
            onEdit={() => {
              setEditingObjectId(selectedObject.id);
              setSelectedObjectId(null);
            }}
            onDelete={() => handleDeleteObject(selectedObject.id)}
          />
        )}

        {selectedText && textsModeActive && (
          <LayoutElementContextPopup
            anchorX={selectedText.position.x}
            anchorY={selectedText.position.y}
            dataAttribute="text"
            onEdit={() => {
              setTextModalState({ mode: "edit", textId: selectedText.id });
              setSelectedTextId(null);
            }}
            onDelete={() => handleDeleteText(selectedText.id)}
          />
        )}

        {selectedVine && selectedVineAnchor && !numberingModeActive && !objectsModeActive && !textsModeActive && (
          <VineContextPopup
            anchorX={selectedVineAnchor.x}
            anchorY={selectedVineAnchor.y}
            onEdit={() => handleEditVine(selectedVine)}
            onDelete={() => handleDeleteVine(selectedVine.id)}
          />
        )}
      </Canvas>

      {editingObject && (
        <EditObjectModal
          object={editingObject}
          onCancel={() => setEditingObjectId(null)}
          onSave={(updates) => handleSaveObject(editingObject.id, updates)}
        />
      )}

      {textModalState?.mode === "create" && (
        <EditTextModal
          mode="create"
          onCancel={() => setTextModalState(null)}
          onSave={(content) =>
            handleCreateText(content, textModalState.position)
          }
        />
      )}

      {textModalState?.mode === "edit" && editingText && (
        <EditTextModal
          mode="edit"
          initialContent={editingText.content}
          onCancel={() => setTextModalState(null)}
          onSave={(content) => handleSaveText(editingText.id, content)}
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
  );
}