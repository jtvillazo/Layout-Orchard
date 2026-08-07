"use client";

import { useRef, useState } from "react";

import {
  parseLayoutBackupJson,
  type LayoutBackupFile,
} from "@/lib/layout-backup";

interface ImportLayoutJsonSectionProps {
  onImport: (backup: LayoutBackupFile) => Promise<void>;
}

export function ImportLayoutJsonSection({
  onImport,
}: ImportLayoutJsonSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [validatedBackup, setValidatedBackup] = useState<LayoutBackupFile | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImportError(null);
    setValidatedBackup(null);
    setShowPreview(false);

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".json")) {
      setImportError("This file is not a valid Layout Orchard backup.");
      return;
    }

    try {
      const text = await file.text();
      const validation = parseLayoutBackupJson(text);

      if (!validation.ok) {
        setImportError(validation.message);
        return;
      }

      setValidatedBackup(validation.backup);
      setShowPreview(true);
    } catch {
      setImportError("This file is not a valid Layout Orchard backup.");
    } finally {
      event.target.value = "";
    }
  }

  function handleCancelPreview() {
    setShowPreview(false);
    setValidatedBackup(null);
    setSelectedFileName(null);
    setImportError(null);
  }

  async function handleConfirmImport() {
    if (!validatedBackup) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      await onImport(validatedBackup);
    } catch {
      setImportError("Import failed. No Layout was created.");
      setShowPreview(false);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <section className="mt-10 border-t border-gray-200 pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#66806b]">
          Import an existing Layout
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Restore a previously exported Layout Orchard JSON backup.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleImportClick}
          className="mt-4 w-full rounded-xl border border-[#66806b]/30 bg-white px-5 py-4 text-sm font-medium text-[#2f4034] transition hover:bg-[#f8faf7]"
        >
          Import Layout JSON
        </button>

        {selectedFileName && !importError && !showPreview && (
          <p className="mt-2 truncate text-sm text-gray-500">{selectedFileName}</p>
        )}

        {importError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">Invalid Layout file</p>
            <p className="mt-1 text-sm text-red-700">{importError}</p>
          </div>
        )}
      </section>

      {showPreview && validatedBackup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Import Layout</h3>
            <p className="mt-2 text-sm text-gray-600">
              You are about to open this Layout:
            </p>

            <dl className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Project</dt>
                <dd className="font-medium text-gray-900">
                  {validatedBackup.data.project.name}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Leader</dt>
                <dd className="text-gray-900">
                  {validatedBackup.data.project.projectLeader}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Orchard</dt>
                <dd className="text-gray-900">{validatedBackup.data.orchard.name}</dd>
              </div>
            </dl>

            {selectedFileName && (
              <p className="mt-3 truncate text-xs text-gray-500">{selectedFileName}</p>
            )}

            <p className="mt-4 text-sm text-gray-600">
              This will open the imported Layout instead of creating a new Layout.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancelPreview}
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
                {isImporting ? "Importing..." : "Import & Open"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
