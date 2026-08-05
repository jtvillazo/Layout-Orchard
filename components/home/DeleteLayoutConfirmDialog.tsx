"use client";

import { useEffect } from "react";

interface DeleteLayoutConfirmDialogProps {
  layoutName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteLayoutConfirmDialog({
  layoutName,
  onCancel,
  onConfirm,
  isDeleting = false,
}: DeleteLayoutConfirmDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isDeleting]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel delete layout"
        className="absolute inset-0 bg-black/50"
        onClick={isDeleting ? undefined : onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-layout-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="delete-layout-title"
          className="text-base font-semibold text-[#1f2a24] sm:text-lg"
        >
          Delete Layout?
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-800">{layoutName}</span> will
          be permanently removed. This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
