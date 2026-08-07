"use client";

import { useState } from "react";

import type { ProjectData } from "@/lib/storage/project-data";
import {
  buildProjectDataSnapshot,
  createLayoutBackup,
  downloadLayoutBackup,
  sanitizeBackupFilename,
} from "@/lib/layout-backup";

interface ExportLayoutModalProps {
  projectData: ProjectData;
  treatments: NonNullable<ProjectData["treatments"]>;
  vines: NonNullable<ProjectData["vines"]>;
  mapObjects: NonNullable<ProjectData["mapObjects"]>;
  mapTexts: NonNullable<ProjectData["mapTexts"]>;
  rows: NonNullable<ProjectData["rows"]>;
  onCancel: () => void;
}

export function ExportLayoutModal({
  projectData,
  treatments,
  vines,
  mapObjects,
  mapTexts,
  rows,
  onCancel,
}: ExportLayoutModalProps) {
  const [filename, setFilename] = useState(projectData.project.name);

  function handleExport() {
    const snapshot = buildProjectDataSnapshot(projectData, {
      treatments,
      vines,
      mapObjects,
      mapTexts,
      rows,
    });
    const backup = createLayoutBackup(snapshot);
    downloadLayoutBackup(filename, backup);
  }

  return (
    <div className="absolute inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/30 p-5">
      <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Export Layout</h2>
          <p className="mt-1 text-sm text-gray-500">
            Download a complete JSON backup of this Layout.
          </p>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              File name
            </span>
            <input
              type="text"
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Saved as {sanitizeBackupFilename(filename) || "Layout backup"}.json
            </p>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={!filename.trim()}
            className="w-full rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export Layout
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
