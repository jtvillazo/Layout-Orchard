"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  addGridToLayout,
  getAllProjects,
  getLayoutData,
  ProjectData,
  updateLayoutTreatments,
  updateLayoutVines,
} from "@/lib/project-store";

import { EditTool, Grid, Treatment, UUID, Vine } from "@/types";

function createId(): UUID {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

import { Canvas } from "@/components/layout-editor/Canvas";
import { EditVineModal, type VineEditableFields } from "@/components/layout-editor/EditVineModal";
import { GridView } from "@/components/layout-editor/GridView";
import { TreatmentModal } from "@/components/layout-editor/TreatmentModal";
import {
  ImportTreatmentsModal,
  type ImportLayoutOption,
} from "@/components/layout-editor/ImportTreatmentsModal";
import { TreatmentsMenu } from "@/components/layout-editor/TreatmentsMenu";
import { ToolsMenu } from "@/components/layout-editor/ToolsMenu";
import { VineContextPopup } from "@/components/layout-editor/VineContextPopup";
import { bayToPixel, computeNextGridPosition, pixelToBay } from "@/lib/grid-geometry";
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

export default function TestGridPage() {
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

  const rowLabels: Record<number, string> = {};

  useEffect(() => {
    if (!layoutId) {
      return;
    }

    const data = getLayoutData(layoutId);

    if (data) {
      setProjectData({
        ...data,
        grids: data.grids ?? [],
      });

      setTreatments(data.treatments ?? []);
      setVines(data.vines ?? []);
    }
  }, [layoutId]);

  if (layoutId && !projectData) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading layout...
        </p>
      </main>
    );
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

  function handleSurfaceClick(target: Element | null) {
    if (activeTool === "numbering") return;
    if (!selectedVineId) return;
    if (target?.closest("[data-vine-popup]")) return;
    if (target?.closest("[data-vine-id]")) return;
    setSelectedVineId(null);
  }

  function handleSelectTool(tool: EditTool) {
    setSelectedVineId(null);
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
    if (activeTool === "numbering") {
      handleNumberingTap(vine);
      return;
    }

    setSelectedVineId(vine.id);
  }

  const grids = projectData?.grids ?? [];
  const layoutTreatments = layoutId
    ? getLayoutTreatments(treatments, layoutId)
    : [];
  const layoutGridIds = new Set(grids.map((grid) => grid.id));
  const layoutVines = vines.filter((vine) => layoutGridIds.has(vine.gridId));
  const vineCountByTreatmentId = countVinesByTreatmentId(layoutVines);
  const numberingModeActive = activeTool === "numbering";
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
      <div className="absolute left-4 top-4 z-50 flex flex-col gap-3">
        <div className="rounded-xl bg-white p-4 shadow-md">
          <p className="text-sm text-gray-800">
            <span className="font-medium text-gray-500">Leader</span>
            <br />
            {projectData?.project.projectLeader}
          </p>

          <p className="mt-3 text-sm text-gray-800">
            <span className="font-medium text-gray-500">Project</span>
            <br />
            <span className="font-semibold">{projectData?.project.name}</span>
          </p>

          <p className="mt-3 text-sm text-gray-800">
            <span className="font-medium text-gray-500">Orchard</span>
            <br />
            {projectData?.orchard.name}
          </p>
        </div>

        {layoutId && (
          <ToolsMenu
            activeTool={activeTool}
            onSelectTool={handleSelectTool}
            onCreateGrid={() => setShowCreateGrid(true)}
          />
        )}
      </div>

      {layoutId && (
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
      )}

      {numberingModeActive && (
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[#66806b]/10"
          aria-hidden="true"
        />
      )}

      {numberingModeActive && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-[#66806b]/30 bg-white/95 px-4 py-2 shadow-md">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#2f4034]">
            Numbering Mode
          </p>
        </div>
      )}

      {numberingModeActive && (
        <div className="absolute bottom-24 left-1/2 z-50 flex -translate-x-1/2 gap-3">
          <button
            type="button"
            onClick={handleResetNumbering}
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm"
          >
            Reset numbers to default
          </button>
        </div>
      )}

      {/* Canvas */}
      <Canvas
        onSurfaceClick={handleSurfaceClick}
        onLongPress={(_clientX, _clientY, point) => {
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
        {selectedVine && selectedVineAnchor && !numberingModeActive && (
          <VineContextPopup
            anchorX={selectedVineAnchor.x}
            anchorY={selectedVineAnchor.y}
            onEdit={() => handleEditVine(selectedVine)}
            onDelete={() => handleDeleteVine(selectedVine.id)}
          />
        )}
      </Canvas>

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