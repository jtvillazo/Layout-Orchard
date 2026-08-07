"use client";

import { useState } from "react";

interface ExportJpgControlsProps {
  defaultFilename: string;
  includeLegend: boolean;
  includeLayoutInfo: boolean;
  canExport: boolean;
  exporting: boolean;
  onIncludeLegendChange: (value: boolean) => void;
  onIncludeLayoutInfoChange: (value: boolean) => void;
  onCancel: () => void;
  onExport: (filename: string) => void;
}

export function ExportJpgControls({
  defaultFilename,
  includeLegend,
  includeLayoutInfo,
  canExport,
  exporting,
  onIncludeLegendChange,
  onIncludeLayoutInfoChange,
  onCancel,
  onExport,
}: ExportJpgControlsProps) {
  const [filename, setFilename] = useState(defaultFilename);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white/98 p-4 shadow-xl backdrop-blur-sm sm:p-5">
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
          Export JPG
        </h2>

        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Options
          </p>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={includeLegend}
              onChange={(event) => onIncludeLegendChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2f4034] focus:ring-[#66806b]"
            />
            <span className="text-sm text-gray-800">Include Treatment Legend</span>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={includeLayoutInfo}
              onChange={(event) =>
                onIncludeLayoutInfoChange(event.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2f4034] focus:ring-[#66806b]"
            />
            <span className="text-sm text-gray-800">
              Include Layout Information
            </span>
          </label>

          <label className="block pt-1">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              File name
            </span>
            <input
              type="text"
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#66806b] sm:px-4 sm:py-3 sm:text-base"
            />
            <p className="mt-1 text-xs text-gray-500">
              Saved as {filename.trim() || "Layout export"}.jpg
            </p>
          </label>
        </div>

        <div className="mt-4 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={exporting}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 disabled:opacity-50 sm:px-4 sm:py-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onExport(filename)}
            disabled={!canExport || exporting || !filename.trim()}
            className="flex-1 rounded-xl bg-[#2f4034] px-3 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3"
          >
            {exporting ? "Exporting…" : "Export JPG"}
          </button>
        </div>
      </div>
    </div>
  );
}
