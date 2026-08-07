"use client";

import { useEffect, useId, useRef } from "react";

import type { ProjectData } from "@/lib/storage/project-data";

interface LayoutInfoPanelProps {
  projectData: ProjectData;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
}

export function LayoutInfoPanel({
  projectData,
  menuOpen,
  onToggleMenu,
  onEdit,
}: LayoutInfoPanelProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        onToggleMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen, onToggleMenu]);

  return (
    <div className="relative rounded-lg bg-white p-1.5 shadow-md sm:rounded-xl sm:p-3 lg:p-4">
      <div ref={menuRef} className="absolute right-1 top-1 sm:right-2 sm:top-2">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls={menuOpen ? menuId : undefined}
          aria-label="Layout information options"
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-base leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 sm:h-8 sm:w-8"
        >
          ⋮
        </button>

        {menuOpen && (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 z-10 mt-1 min-w-[7rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      <dl className="space-y-1 pr-8 sm:space-y-2 sm:pr-9 lg:space-y-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
          <dt className="font-medium text-gray-500 lg:mb-0">Leader</dt>
          <dd className="truncate font-medium text-gray-800 lg:mt-0">
            {projectData.project.projectLeader}
          </dd>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
          <dt className="font-medium text-gray-500 lg:mb-0">Project</dt>
          <dd className="truncate font-semibold text-gray-800 lg:mt-0">
            {projectData.project.name}
          </dd>
        </div>

        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-snug sm:text-xs lg:block lg:text-sm">
          <dt className="font-medium text-gray-500 lg:mb-0">Orchard</dt>
          <dd className="truncate font-medium text-gray-800 lg:mt-0">
            {projectData.orchard.name}
          </dd>
        </div>
      </dl>
    </div>
  );
}
