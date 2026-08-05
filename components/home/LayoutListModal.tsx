"use client";

import { useEffect, useState } from "react";

import { sortLayoutsByLastEdited } from "@/lib/layout-list-utils";
import type { ProjectData } from "@/lib/storage/project-data";

import { DeleteLayoutConfirmDialog } from "./DeleteLayoutConfirmDialog";
import { LayoutListItem } from "./LayoutListItem";

interface LayoutListModalProps {
  title: string;
  layouts: ProjectData[];
  onClose: () => void;
  onOpenLayout: (layoutId: string) => void;
  onDeleteLayout: (layoutId: string) => Promise<boolean>;
}

export function LayoutListModal({
  title,
  layouts,
  onClose,
  onOpenLayout,
  onDeleteLayout,
}: LayoutListModalProps) {
  const sortedLayouts = sortLayoutsByLastEdited(layouts);
  const [openMenuLayoutId, setOpenMenuLayoutId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingDelete) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, pendingDelete]);

  function handleToggleMenu(layoutId: string) {
    setOpenMenuLayoutId((current) => (current === layoutId ? null : layoutId));
  }

  function handleRequestDelete(data: ProjectData) {
    setOpenMenuLayoutId(null);
    setPendingDelete(data);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const deleted = await onDeleteLayout(pendingDelete.layout.id);
      if (deleted) {
        setPendingDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
        <button
          type="button"
          aria-label="Close layout list"
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="layout-list-modal-title"
          className="relative flex max-h-[90vh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-[#f5f6f2] shadow-2xl sm:max-h-[70vh] sm:max-w-lg sm:w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0 pr-3">
              <h2
                id="layout-list-modal-title"
                className="truncate text-base font-semibold text-[#1f2a24] sm:text-lg"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Tap a layout to open it in the editor.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-600 transition hover:bg-gray-200"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
            {sortedLayouts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No layouts available.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {sortedLayouts.map((layout) => (
                  <li key={layout.layout.id}>
                    <LayoutListItem
                      data={layout}
                      menuOpen={openMenuLayoutId === layout.layout.id}
                      onOpen={onOpenLayout}
                      onToggleMenu={handleToggleMenu}
                      onRequestDelete={handleRequestDelete}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {pendingDelete && (
        <DeleteLayoutConfirmDialog
          layoutName={pendingDelete.project.name}
          onCancel={() => {
            if (!isDeleting) {
              setPendingDelete(null);
            }
          }}
          onConfirm={() => void handleConfirmDelete()}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}
