"use client";

import { useEffect, useRef } from "react";

import { ExportJpgSelectionOverlay } from "@/components/layout-editor/ExportJpgSelectionOverlay";
import { useCanvasUi } from "@/components/layout-editor/canvas-ui-context";
import type { ContentRect } from "@/lib/content-rect";
import { normalizeContentRect } from "@/lib/content-rect";

interface ExportJpgCanvasToolsProps {
  selection: ContentRect | null;
  onSelectionChange: (rect: ContentRect | null) => void;
  contentGroupRef: React.MutableRefObject<SVGGElement | null>;
}

export function ExportJpgCanvasTools({
  selection,
  onSelectionChange,
  contentGroupRef,
}: ExportJpgCanvasToolsProps) {
  const {
    getContentGroupElement,
    getContainerRect,
    screenClientToContentPoint,
    viewRevision,
  } = useCanvasUi();
  const initializedRef = useRef(false);

  useEffect(() => {
    contentGroupRef.current = getContentGroupElement();
  }, [contentGroupRef, getContentGroupElement, viewRevision]);

  useEffect(() => {
    if (initializedRef.current || selection) {
      return;
    }

    const container = getContainerRect();
    if (!container) {
      return;
    }

    const insetX = container.width * 0.08;
    const insetY = container.height * 0.12;
    const topLeft = screenClientToContentPoint(
      container.left + insetX,
      container.top + insetY
    );
    const bottomRight = screenClientToContentPoint(
      container.right - insetX,
      container.bottom - insetY
    );

    if (topLeft && bottomRight) {
      initializedRef.current = true;
      onSelectionChange(
        normalizeContentRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y)
      );
    }
  }, [
    getContainerRect,
    onSelectionChange,
    screenClientToContentPoint,
    selection,
    viewRevision,
  ]);

  return (
    <ExportJpgSelectionOverlay
      selection={selection}
      onSelectionChange={onSelectionChange}
    />
  );
}
