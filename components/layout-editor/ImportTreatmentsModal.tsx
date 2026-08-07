"use client";

import { useEffect, useMemo, useState } from "react";

import { TreatmentColorSwatch } from "@/components/layout-editor/TreatmentColorSwatch";
import type { Treatment, UUID } from "@/types";

export interface ImportLayoutOption {
  layoutId: UUID;
  label: string;
  treatments: Treatment[];
}

interface ImportTreatmentsModalProps {
  layoutOptions: ImportLayoutOption[];
  onImport: (selectedTreatments: Treatment[]) => void;
  onCancel: () => void;
}

export function ImportTreatmentsModal({
  layoutOptions,
  onImport,
  onCancel,
}: ImportTreatmentsModalProps) {
  const [sourceLayoutId, setSourceLayoutId] = useState<UUID | "">(
    layoutOptions[0]?.layoutId ?? ""
  );
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState<Set<UUID>>(
    new Set()
  );

  const selectedLayout = useMemo(
    () => layoutOptions.find((option) => option.layoutId === sourceLayoutId),
    [layoutOptions, sourceLayoutId]
  );

  const sourceTreatments = selectedLayout?.treatments ?? [];

  useEffect(() => {
    setSelectedTreatmentIds(new Set());
  }, [sourceLayoutId]);

  function toggleTreatment(treatmentId: UUID) {
    setSelectedTreatmentIds((current) => {
      const next = new Set(current);
      if (next.has(treatmentId)) {
        next.delete(treatmentId);
      } else {
        next.add(treatmentId);
      }
      return next;
    });
  }

  function handleImport() {
    const selected = sourceTreatments.filter((treatment) =>
      selectedTreatmentIds.has(treatment.id)
    );
    if (selected.length === 0) return;
    onImport(selected);
  }

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/30 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Import Treatments</h2>
          <p className="mt-1 text-sm text-gray-500">
            Copy treatments from another layout into this one.
          </p>
        </div>

        {layoutOptions.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No other layouts are available to import from. Create another
            project first.
          </p>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Source Layout
              </span>
              <select
                value={sourceLayoutId}
                onChange={(event) => setSourceLayoutId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
              >
                {layoutOptions.map((option) => (
                  <option key={option.layoutId} value={option.layoutId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {sourceTreatments.length === 0 ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                This layout has no treatments to import.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2">
                {sourceTreatments.map((treatment) => {
                  const isChecked = selectedTreatmentIds.has(treatment.id);

                  return (
                    <li key={treatment.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTreatment(treatment.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#2f4034] focus:ring-[#66806b]"
                        />
                        <TreatmentColorSwatch treatment={treatment} />
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                          {treatment.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={
              layoutOptions.length === 0 ||
              sourceTreatments.length === 0 ||
              selectedTreatmentIds.size === 0
            }
            className="flex-1 rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
