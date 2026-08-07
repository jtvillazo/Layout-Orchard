"use client";

import { useRef, useState } from "react";

import type { ProjectData } from "@/lib/storage/project-data";
import {
  buildProjectDataSnapshot,
  createLayoutBackup,
  downloadLayoutBackup,
  parseLayoutBackupJson,
  sanitizeBackupFilename,
  type LayoutBackupFile,
} from "@/lib/layout-backup";

type ExportImportTab = "export" | "import";

interface ExportImportLayoutModalProps {
  projectData: ProjectData;
  treatments: NonNullable<ProjectData["treatments"]>;
  vines: NonNullable<ProjectData["vines"]>;
  mapObjects: NonNullable<ProjectData["mapObjects"]>;
  mapTexts: NonNullable<ProjectData["mapTexts"]>;
  rows: NonNullable<ProjectData["rows"]>;
  onImport: (backup: LayoutBackupFile) => Promise<boolean>;
  onCancel: () => void;
}

export function ExportImportLayoutModal({
  projectData,
  treatments,
  vines,
  mapObjects,
  mapTexts,
  rows,
  onImport,
  onCancel,
}: ExportImportLayoutModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ExportImportTab>("export");
  const [filename, setFilename] = useState(projectData.project.name);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileText, setSelectedFileText] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validatedBackup, setValidatedBackup] = useState<LayoutBackupFile | null>(
    null
  );

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

  function handleChooseFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportError(null);
    setValidatedBackup(null);
    setShowConfirmImport(false);

    if (!file) {
      setSelectedFileName(null);
      setSelectedFileText(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      setSelectedFileName(file.name);
      setSelectedFileText(null);
      setImportError("This file is not a valid Layout Orchard backup.");
      return;
    }

    try {
      const text = await file.text();
      const validation = parseLayoutBackupJson(text);

      setSelectedFileName(file.name);

      if (!validation.ok) {
        setSelectedFileText(null);
        setImportError(validation.message);
        return;
      }

      setSelectedFileText(text);
      setValidatedBackup(validation.backup);
      setImportError(null);
    } catch {
      setSelectedFileName(file.name);
      setSelectedFileText(null);
      setImportError("This file is not a valid Layout Orchard backup.");
    }
  }

  function handleImportClick() {
    if (!selectedFileText || !validatedBackup) {
      setImportError("Choose a Layout backup file before importing.");
      return;
    }

    setShowConfirmImport(true);
  }

  async function handleConfirmImport() {
    if (!validatedBackup) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const success = await onImport(validatedBackup);
      if (!success) {
        setImportError("Import failed. The current Layout was not changed.");
        setShowConfirmImport(false);
      }
    } catch {
      setImportError("Import failed. The current Layout was not changed.");
      setShowConfirmImport(false);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/30 p-5">
        <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Export/Import Layout</h2>
            <p className="mt-1 text-sm text-gray-500">
              Back up or restore the complete Layout as JSON.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "export"
                  ? "bg-white text-[#2f4034] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("import")}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "import"
                  ? "bg-white text-[#2f4034] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Import
            </button>
          </div>

          {activeTab === "export" ? (
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
                  Saved as {sanitizeBackupFilename(filename) || "Layout backup"}
                  .json
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
          ) : (
            <div className="space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={handleChooseFileClick}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#2f4034]"
              >
                Choose Layout File
              </button>

              {selectedFileName && (
                <p className="truncate text-sm text-gray-700">{selectedFileName}</p>
              )}

              {importError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-800">
                    Invalid Layout file
                  </p>
                  <p className="mt-1 text-sm text-red-700">{importError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleImportClick}
                disabled={!validatedBackup || isImporting}
                className="w-full rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Import Layout
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
          >
            Close
          </button>
        </div>
      </div>

      {showConfirmImport && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/30 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Import Layout?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will replace the current Layout with the imported Layout.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmImport(false)}
                disabled={isImporting}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="flex-1 rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
