"use client";

import { useState } from "react";

import type { EditTool, PredefinedObjectIcon } from "@/types";

import { OBJECT_TYPE_DEFINITIONS } from "@/lib/object-types";

interface ToolsMenuProps {
  activeTool: EditTool;
  onSelectTool: (tool: EditTool) => void;
  onCreateGrid: () => void;
  selectedObjectType: PredefinedObjectIcon;
  onSelectObjectType: (type: PredefinedObjectIcon) => void;
  className?: string;
}

export function ToolsMenu({
  activeTool,
  onSelectTool,
  onCreateGrid,
  selectedObjectType,
  onSelectObjectType,
  className = "",
}: ToolsMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const numberingActive = activeTool === "numbering";
  const objectsActive = activeTool === "createObject";
  const textsActive = activeTool === "createText";

  function handleNumberingClick() {
    onSelectTool(numberingActive ? "none" : "numbering");
  }

  function handleObjectsClick() {
    onSelectTool(objectsActive ? "none" : "createObject");
  }

  function handleTextsClick() {
    onSelectTool(textsActive ? "none" : "createText");
  }

  return (
    <div
      data-tools-menu="true"
      className={`w-full max-w-[6.75rem] rounded-lg border border-gray-200 bg-white shadow-md sm:max-w-none sm:rounded-xl lg:w-44 ${className}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-10 w-full items-center justify-between px-2 py-1.5 text-left sm:min-h-11 sm:px-4 sm:py-3"
      >
        <span className="text-xs font-semibold text-gray-800 sm:text-sm">Tools</span>
        <span className="text-xs text-gray-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-2 pb-2">
          <button
            type="button"
            onClick={onCreateGrid}
            className="mt-1 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs text-gray-800 active:bg-gray-50 sm:text-sm"
          >
            Create Grid
          </button>

          <button
            type="button"
            onClick={handleNumberingClick}
            className={`mt-1 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs active:bg-gray-50 sm:text-sm ${
              numberingActive
                ? "bg-[#f3f7f4] font-medium text-[#2f4034]"
                : "text-gray-800"
            }`}
          >
            Numbering
          </button>

          <button
            type="button"
            onClick={handleObjectsClick}
            className={`mt-1 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs active:bg-gray-50 sm:text-sm ${
              objectsActive
                ? "bg-[#eef4ff] font-medium text-[#1e3a8a]"
                : "text-gray-800"
            }`}
          >
            Objects
          </button>

          {objectsActive && (
            <div className="mt-1 space-y-1 rounded-lg border border-blue-100 bg-blue-50/60 p-1.5">
              {OBJECT_TYPE_DEFINITIONS.map((definition) => {
                const selected = selectedObjectType === definition.type;

                return (
                  <button
                    key={definition.type}
                    type="button"
                    onClick={() => onSelectObjectType(definition.type)}
                    className={`min-h-9 w-full rounded-md px-2 py-1.5 text-left text-[11px] sm:text-xs ${
                      selected
                        ? "bg-white font-medium text-[#1e3a8a] shadow-sm"
                        : "text-gray-700 active:bg-white/70"
                    }`}
                  >
                    {definition.name}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleTextsClick}
            className={`mt-1 min-h-10 w-full rounded-lg px-2 py-2 text-left text-xs active:bg-gray-50 sm:text-sm ${
              textsActive
                ? "bg-[#fdf4ff] font-medium text-[#6b21a8]"
                : "text-gray-800"
            }`}
          >
            Texts
          </button>
        </div>
      )}
    </div>
  );
}
