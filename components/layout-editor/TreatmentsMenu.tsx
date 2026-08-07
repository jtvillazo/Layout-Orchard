"use client";

import { useEffect, useRef, useState } from "react";

import { TreatmentColorSwatch } from "@/components/layout-editor/TreatmentColorSwatch";
import type { Treatment, UUID } from "@/types";

interface TreatmentsMenuProps {
  treatments: Treatment[];
  vineCountByTreatmentId: Record<UUID, number>;
  selectedTreatmentId: UUID | null;
  deleteWarning: { treatmentName: string; count: number } | null;
  onToggleSelectTreatment: (treatmentId: UUID) => void;
  onDismissPopup: () => void;
  onDismissDeleteWarning: () => void;
  onEditTreatment: (treatment: Treatment) => void;
  onDeleteTreatment: (treatment: Treatment) => void;
  onCreateTreatment: () => void;
  onImportTreatments: () => void;
  className?: string;
}

function TreatmentContextPopup({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-treatment-popup="true"
      className="absolute left-0 top-full z-10 mt-1 w-full min-w-[140px] overflow-hidden rounded-md border border-[#D1D5DB] bg-white shadow-md"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="block w-full px-3 py-2 text-left text-xs text-[#374151] hover:bg-gray-50"
      >
        Edit
      </button>
      <div className="mx-2 border-t border-[#E5E7EB]" />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="block w-full px-3 py-2 text-left text-xs text-[#DC2626] hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}

export function TreatmentsMenu({
  treatments,
  vineCountByTreatmentId,
  selectedTreatmentId,
  deleteWarning,
  onToggleSelectTreatment,
  onDismissPopup,
  onDismissDeleteWarning,
  onEditTreatment,
  onDeleteTreatment,
  onCreateTreatment,
  onImportTreatments,
  className = "",
}: TreatmentsMenuProps) {
  const [expanded, setExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedTreatmentId) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      onDismissPopup();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [selectedTreatmentId, onDismissPopup]);

  return (
    <div
      ref={menuRef}
      data-treatment-menu="true"
      className={`w-full max-w-[7.4rem] rounded-lg border border-gray-200 bg-white shadow-md sm:max-w-none sm:rounded-xl lg:w-52 ${className}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between px-2 py-1.5 text-left sm:min-h-11 sm:px-4 sm:py-3"
      >
        <span className="text-xs font-semibold text-gray-800 sm:text-sm">Treatments</span>
        <span className="text-xs text-gray-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-2 pb-2">
          {deleteWarning && (
            <div className="mx-1 mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p>
                This treatment is assigned to {deleteWarning.count}{" "}
                {deleteWarning.count === 1 ? "vine" : "vines"}.
              </p>
              <p className="mt-1">
                Remove the treatment from those vines before deleting it.
              </p>
              <button
                type="button"
                onClick={onDismissDeleteWarning}
                className="mt-2 text-xs font-medium text-amber-800 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {treatments.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500">
              No treatments yet.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {treatments.map((treatment) => {
                const count = vineCountByTreatmentId[treatment.id] ?? 0;
                const isSelected = selectedTreatmentId === treatment.id;

                return (
                  <li key={treatment.id} className="relative">
                    <button
                      type="button"
                      data-treatment-id={treatment.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleSelectTreatment(treatment.id);
                      }}
                      className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs active:bg-gray-50 sm:text-sm ${
                        isSelected ? "bg-[#f3f7f4]" : ""
                      }`}
                    >
                      <TreatmentColorSwatch treatment={treatment} />
                      <span className="min-w-0 flex-1 truncate text-gray-800">
                        {treatment.name}
                      </span>
                      <span className="shrink-0 text-xs text-gray-500">
                        ({count})
                      </span>
                    </button>

                    {isSelected && (
                      <TreatmentContextPopup
                        onEdit={() => onEditTreatment(treatment)}
                        onDelete={() => onDeleteTreatment(treatment)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={onCreateTreatment}
            className="mt-2 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-[#2f4034] active:bg-gray-50 sm:text-sm"
          >
            + Create new Treatment
          </button>

          <button
            type="button"
            onClick={onImportTreatments}
            className="mt-1 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-[#2f4034] active:bg-gray-50 sm:text-sm"
          >
            Import from another Layout
          </button>
        </div>
      )}
    </div>
  );
}
