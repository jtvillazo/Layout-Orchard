"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  addGridToLayout,
  getLayoutData,
  ProjectData,
} from "@/lib/project-store";

import { Grid, UUID, Vine } from "@/types";

function createId(): UUID {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

import { Canvas } from "@/components/layout-editor/Canvas";
import { GridView } from "@/components/layout-editor/GridView";
import { pixelToBay } from "@/lib/grid-geometry";
import { getFirstAvailableSlot } from "@/lib/vine-slots";

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

      // Por ahora las vines empiezan vacías.
      // Más adelante las cargaremos desde project-store.
      setVines([]);
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
      position: {
        x: 0,
        y: 0,
      },
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

  function handleCreateVineAtBay(grid: Grid, rowNumber: number, bayIndex: number) {
    setVines((current) => {
      const vinesInBay = current.filter(
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
        return current;
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

      return [...current, newVine];
    });
  }

  const grids = projectData?.grids ?? [];

  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <div className="absolute left-4 top-4 z-50 rounded-xl bg-white p-4 shadow-md">
        <p className="font-semibold">
          {projectData?.project.name}
        </p>

        <p className="text-sm text-gray-500">
          {projectData?.orchard.name}
        </p>

        <p className="text-sm text-gray-500">
          {projectData?.blocks
            .map((block) => block.name)
            .join(", ")}
        </p>

        <button
          type="button"
          onClick={() => setShowCreateGrid(true)}
          className="mt-3 rounded-lg bg-[#2f4034] px-4 py-2 text-sm font-medium text-white"
        >
          + Create Grid
        </button>

        {/* Botón temporal para probar Vine */}
        {grids.length > 0 && (
          <button
            type="button"
            onClick={() => handleCreateVineAtBay(grids[0], 1, 1)}
            className="mt-2 block rounded-lg bg-[#66806b] px-4 py-2 text-sm font-medium text-white"
          >
            + Test Vine
          </button>
        )}

        {/* Contador temporal */}
        {vines.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Vines: {vines.length}
          </p>
        )}
      </div>

      {/* Canvas */}
      <Canvas
        onLongPress={(_clientX, _clientY, point) => {
          if (!point || grids.length === 0) {
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
              vines={vines.filter(
                (vine) => vine.gridId === grid.id
              )}
              treatments={[]}
              rowLabels={rowLabels}
              onVineClick={(vine) =>
                console.log("Click en vine:", vine.id)
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
      </Canvas>

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