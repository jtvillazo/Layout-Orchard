"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useCanvasUi } from "@/components/layout-editor/canvas-ui-context";
import type { ContentRect } from "@/lib/content-rect";
import {
  moveContentRect,
  normalizeContentRect,
  pointInContentRect,
  resizeContentRect,
  type ResizeHandle,
} from "@/lib/content-rect";

interface ExportJpgSelectionOverlayProps {
  selection: ContentRect | null;
  onSelectionChange: (rect: ContentRect | null) => void;
}

type DragMode =
  | { kind: "create"; startX: number; startY: number }
  | { kind: "move"; startX: number; startY: number; anchor: ContentRect }
  | { kind: "resize"; handle: ResizeHandle; anchor: ContentRect };

const HANDLE_SIZE = 14;
const BORDER_HIT = 10;

function contentRectToScreen(
  rect: ContentRect,
  contentToContainer: (x: number, y: number) => { x: number; y: number } | null
) {
  const topLeft = contentToContainer(rect.x, rect.y);
  const bottomRight = contentToContainer(rect.x + rect.width, rect.y + rect.height);

  if (!topLeft || !bottomRight) {
    return null;
  }

  return {
    left: Math.min(topLeft.x, bottomRight.x),
    top: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}

function getResizeHandleAtPoint(
  rect: ContentRect,
  contentX: number,
  contentY: number,
  scale: number
): ResizeHandle | null {
  const hit = Math.max(HANDLE_SIZE / scale, 8);
  const { x, y, width, height } = rect;
  const right = x + width;
  const bottom = y + height;
  const midX = x + width / 2;
  const midY = y + height / 2;

  const handles: Array<{ handle: ResizeHandle; px: number; py: number }> = [
    { handle: "nw", px: x, py: y },
    { handle: "n", px: midX, py: y },
    { handle: "ne", px: right, py: y },
    { handle: "e", px: right, py: midY },
    { handle: "se", px: right, py: bottom },
    { handle: "s", px: midX, py: bottom },
    { handle: "sw", px: x, py: bottom },
    { handle: "w", px: x, py: midY },
  ];

  for (const item of handles) {
    if (
      Math.abs(contentX - item.px) <= hit &&
      Math.abs(contentY - item.py) <= hit
    ) {
      return item.handle;
    }
  }

  return null;
}

function isOnSelectionBorder(
  rect: ContentRect,
  contentX: number,
  contentY: number,
  scale: number
): boolean {
  if (!pointInContentRect(contentX, contentY, rect)) {
    return false;
  }

  const margin = Math.max(BORDER_HIT / scale, 6);
  return (
    contentX <= rect.x + margin ||
    contentX >= rect.x + rect.width - margin ||
    contentY <= rect.y + margin ||
    contentY >= rect.y + rect.height - margin
  );
}

export function ExportJpgSelectionOverlay({
  selection,
  onSelectionChange,
}: ExportJpgSelectionOverlayProps) {
  const {
    contentToContainer,
    screenClientToContentPoint,
    getContentUiScale,
    viewRevision,
  } = useCanvasUi();
  const dragRef = useRef<DragMode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }

      const point = screenClientToContentPoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      if (drag.kind === "create") {
        onSelectionChange(
          normalizeContentRect(drag.startX, drag.startY, point.x, point.y)
        );
        return;
      }

      if (drag.kind === "move") {
        onSelectionChange(
          moveContentRect(
            drag.anchor,
            point.x - drag.startX,
            point.y - drag.startY
          )
        );
        return;
      }

      onSelectionChange(
        resizeContentRect(
          drag.anchor,
          drag.handle,
          point.x,
          point.y,
          drag.anchor
        )
      );
    };

    const handleUp = () => {
      endDrag();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [endDrag, isDragging, onSelectionChange, screenClientToContentPoint]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" && event.isPrimary === false) {
      return;
    }

    const point = screenClientToContentPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const scale = getContentUiScale();

    if (selection) {
      const handle = getResizeHandleAtPoint(selection, point.x, point.y, scale);
      if (handle) {
        dragRef.current = { kind: "resize", handle, anchor: selection };
        setIsDragging(true);
        return;
      }

      if (isOnSelectionBorder(selection, point.x, point.y, scale)) {
        dragRef.current = {
          kind: "move",
          startX: point.x,
          startY: point.y,
          anchor: selection,
        };
        setIsDragging(true);
        return;
      }

      return;
    }

    dragRef.current = {
      kind: "create",
      startX: point.x,
      startY: point.y,
    };
    onSelectionChange(
      normalizeContentRect(point.x, point.y, point.x, point.y)
    );
    setIsDragging(true);
  };

  const screenRect = selection
    ? contentRectToScreen(selection, contentToContainer)
    : null;

  void viewRevision;

  const handlePositions = selection
    ? (() => {
        const corners = [
          { handle: "nw" as const, x: selection.x, y: selection.y },
          {
            handle: "ne" as const,
            x: selection.x + selection.width,
            y: selection.y,
          },
          {
            handle: "se" as const,
            x: selection.x + selection.width,
            y: selection.y + selection.height,
          },
          {
            handle: "sw" as const,
            x: selection.x,
            y: selection.y + selection.height,
          },
          {
            handle: "n" as const,
            x: selection.x + selection.width / 2,
            y: selection.y,
          },
          {
            handle: "e" as const,
            x: selection.x + selection.width,
            y: selection.y + selection.height / 2,
          },
          {
            handle: "s" as const,
            x: selection.x + selection.width / 2,
            y: selection.y + selection.height,
          },
          {
            handle: "w" as const,
            x: selection.x,
            y: selection.y + selection.height / 2,
          },
        ];

        return corners
          .map((item) => {
            const screen = contentToContainer(item.x, item.y);
            if (!screen) {
              return null;
            }

            return {
              handle: item.handle,
              left: screen.x - HANDLE_SIZE / 2,
              top: screen.y - HANDLE_SIZE / 2,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
      })()
    : [];

  return (
    <div
      className="absolute inset-0 z-[5]"
      style={{ touchAction: "none", pointerEvents: selection ? "none" : "auto" }}
      onPointerDown={selection ? undefined : handlePointerDown}
    >
      {!selection && (
        <div className="pointer-events-none absolute inset-0 bg-black/20">
          <p className="absolute left-1/2 top-24 max-w-xs -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-center text-xs font-medium text-[#2f4034] shadow-md sm:text-sm">
            Drag to select an area to export
          </p>
        </div>
      )}

      {screenRect && selection && (
        <>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute bg-black/35"
              style={{ left: 0, top: 0, right: 0, height: screenRect.top }}
            />
            <div
              className="absolute bg-black/35"
              style={{
                left: 0,
                top: screenRect.top,
                width: screenRect.left,
                height: screenRect.height,
              }}
            />
            <div
              className="absolute bg-black/35"
              style={{
                left: screenRect.left + screenRect.width,
                top: screenRect.top,
                right: 0,
                height: screenRect.height,
              }}
            />
            <div
              className="absolute bg-black/35"
              style={{
                left: 0,
                top: screenRect.top + screenRect.height,
                right: 0,
                bottom: 0,
              }}
            />
          </div>

          <div
            className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_1px_rgba(47,64,52,0.65)]"
            style={{
              left: screenRect.left,
              top: screenRect.top,
              width: screenRect.width,
              height: screenRect.height,
            }}
          />

          {(["n", "s", "e", "w"] as const).map((edge) => {
            const edgeSize = Math.max(BORDER_HIT, 10);
            const style: CSSProperties = {
              pointerEvents: "auto",
              position: "absolute",
              cursor: isDragging ? "grabbing" : "grab",
            };

            if (edge === "n") {
              Object.assign(style, {
                left: screenRect.left,
                top: screenRect.top,
                width: screenRect.width,
                height: edgeSize,
              });
            } else if (edge === "s") {
              Object.assign(style, {
                left: screenRect.left,
                top: screenRect.top + screenRect.height - edgeSize,
                width: screenRect.width,
                height: edgeSize,
              });
            } else if (edge === "w") {
              Object.assign(style, {
                left: screenRect.left,
                top: screenRect.top + edgeSize,
                width: edgeSize,
                height: Math.max(screenRect.height - edgeSize * 2, edgeSize),
              });
            } else {
              Object.assign(style, {
                left: screenRect.left + screenRect.width - edgeSize,
                top: screenRect.top + edgeSize,
                width: edgeSize,
                height: Math.max(screenRect.height - edgeSize * 2, edgeSize),
              });
            }

            return (
              <div
                key={edge}
                aria-hidden="true"
                style={style}
                onPointerDown={handlePointerDown}
              />
            );
          })}

          {handlePositions.map((handle) => (
            <div
              key={handle.handle}
              className="absolute rounded-sm border border-[#2f4034] bg-white shadow-sm"
              style={{
                left: handle.left,
                top: handle.top,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                pointerEvents: "auto",
                cursor: `${handle.handle}-resize`,
              }}
              onPointerDown={handlePointerDown}
            />
          ))}
        </>
      )}
    </div>
  );
}
