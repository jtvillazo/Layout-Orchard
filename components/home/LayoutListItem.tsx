"use client";

import { useEffect, useId, useRef } from "react";

import type { ProjectData } from "@/lib/storage/project-data";

interface LayoutListItemProps {
  data: ProjectData;
  menuOpen: boolean;
  onOpen: (layoutId: string) => void;
  onToggleMenu: (layoutId: string) => void;
  onRequestDelete: (data: ProjectData) => void;
}

export function LayoutListItem({
  data,
  menuOpen,
  onOpen,
  onToggleMenu,
  onRequestDelete,
}: LayoutListItemProps) {
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
        onToggleMenu(data.layout.id);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen, data.layout.id, onToggleMenu]);

  return (
    <div className="relative rounded-xl border border-gray-200 bg-white transition sm:hover:border-[#66806b]/40">
      <button
        type="button"
        onClick={() => onOpen(data.layout.id)}
        className="w-full px-4 py-3 pr-12 text-left transition active:bg-gray-50 sm:px-5 sm:py-4 sm:hover:bg-[#f8faf7]"
      >
        <p className="truncate font-medium text-[#1f2a24]">{data.project.name}</p>
        <p className="mt-1 truncate text-sm text-gray-500">{data.orchard.name}</p>
        <p className="mt-0.5 truncate text-sm text-gray-500">
          {data.project.projectLeader}
        </p>
      </button>

      <div ref={menuRef} className="absolute right-2 top-2 sm:right-3 sm:top-3">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-controls={menuOpen ? menuId : undefined}
          aria-label={`Layout options for ${data.project.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu(data.layout.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          ⋮
        </button>

        {menuOpen && (
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 z-10 mt-1 min-w-[7.5rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onRequestDelete(data);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
