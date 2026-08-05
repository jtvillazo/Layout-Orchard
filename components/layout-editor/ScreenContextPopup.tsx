"use client";

import { useLayoutEffect, useState } from "react";

import { useCanvasUi } from "./canvas-ui-context";

const POPUP_WIDTH = 88;
const ROW_HEIGHT = 36;
const POPUP_HEIGHT = ROW_HEIGHT * 2;
const ANCHOR_GAP = 10;

interface ScreenContextPopupProps {
  anchorContentX: number;
  anchorContentY: number;
  editLabel?: string;
  deleteLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  vinePopup?: boolean;
  layoutPopupAttribute?: string;
}

export function ScreenContextPopup({
  anchorContentX,
  anchorContentY,
  editLabel = "Edit",
  deleteLabel = "Delete",
  onEdit,
  onDelete,
  vinePopup = false,
  layoutPopupAttribute,
}: ScreenContextPopupProps) {
  const { contentToContainer, viewRevision } = useCanvasUi();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    setPosition(contentToContainer(anchorContentX, anchorContentY));
  }, [anchorContentX, anchorContentY, contentToContainer, viewRevision]);

  if (!position) {
    return null;
  }

  return (
    <div
      data-screen-context-popup="true"
      {...(vinePopup ? { "data-vine-popup": "true" } : {})}
      {...(layoutPopupAttribute
        ? { "data-layout-element-popup": layoutPopupAttribute }
        : {})}
      className="pointer-events-auto absolute z-10"
      style={{
        left: position.x,
        top: position.y - ANCHOR_GAP - POPUP_HEIGHT,
        width: POPUP_WIDTH,
        transform: "translateX(-50%)",
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="overflow-hidden rounded-md border border-[#D1D5DB] bg-white shadow-md"
        style={{ width: POPUP_WIDTH, height: POPUP_HEIGHT }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="flex min-h-9 w-full items-center justify-center text-xs text-[#374151] active:bg-gray-50"
          style={{ height: ROW_HEIGHT }}
        >
          {editLabel}
        </button>

        <div className="mx-2 border-t border-[#E5E7EB]" />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="flex min-h-9 w-full items-center justify-center text-xs text-[#DC2626] active:bg-red-50"
          style={{ height: ROW_HEIGHT }}
        >
          {deleteLabel}
        </button>
      </div>

      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: POPUP_HEIGHT,
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "7px solid #FFFFFF",
          filter: "drop-shadow(0 1px 0 #D1D5DB)",
        }}
      />
    </div>
  );
}
