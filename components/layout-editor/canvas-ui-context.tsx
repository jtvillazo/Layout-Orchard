"use client";

import { createContext, useContext } from "react";

export interface CanvasUiContextValue {
  contentToContainer: (contentX: number, contentY: number) => { x: number; y: number } | null;
  viewRevision: number;
  /** Content units per CSS pixel — use to keep on-canvas UI at a consistent screen size. */
  getContentUiScale: () => number;
}

export const CanvasUiContext = createContext<CanvasUiContextValue | null>(null);

export function useCanvasUi() {
  const context = useContext(CanvasUiContext);

  if (!context) {
    throw new Error("useCanvasUi must be used within Canvas");
  }

  return context;
}
