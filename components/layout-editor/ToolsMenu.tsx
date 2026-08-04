"use client";

import { useState } from "react";

import type { EditTool } from "@/types";

interface ToolsMenuProps {
  activeTool: EditTool;
  onSelectTool: (tool: EditTool) => void;
  onCreateGrid: () => void;
}

export function ToolsMenu({
  activeTool,
  onSelectTool,
  onCreateGrid,
}: ToolsMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const numberingActive = activeTool === "numbering";

  function handleNumberingClick() {
    onSelectTool(numberingActive ? "none" : "numbering");
  }

  return (
    <div
      data-tools-menu="true"
      className="w-44 rounded-xl border border-gray-200 bg-white shadow-md"
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-800">Tools</span>
        <span className="text-xs text-gray-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-2 pb-2">
          <button
            type="button"
            onClick={onCreateGrid}
            className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
          >
            Create Grid
          </button>

          <button
            type="button"
            onClick={handleNumberingClick}
            className={`mt-1 w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50 ${
              numberingActive
                ? "bg-[#f3f7f4] font-medium text-[#2f4034]"
                : "text-gray-800"
            }`}
          >
            Numbering
          </button>

          {/* Future: Objects, Texts */}
        </div>
      )}
    </div>
  );
}
