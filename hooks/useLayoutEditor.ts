"use client";

import { useState, useCallback } from "react";

// ─── Tipos de estado (ya definidos en un paso anterior, se centralizan en types/index.ts) ───

type LayoutMode = "readonly" | "edit";

type EditTool =
  | "none"
  | "createGrid"
  | "createVine"
  | "createObject"
  | "createText"
  | "select"
  | "numbering";

interface SelectionState {
  active: boolean;
  selectedIds: string[];
  selectedType: "vine" | "object" | "text" | null;
}

interface NumberingModeState {
  active: boolean;
  treatmentId: string | null;
  counter: number;
  autoSnakeApplied: boolean;
}

interface VineEditorPopupState {
  open: boolean;
  mode: "create" | "edit";
  gridId: string;
  rowNumber: number;
  bayIndex: number;
  targetSlot?: 1 | 2 | 3;
  existingVineId?: string;
}

const initialSelection: SelectionState = {
  active: false,
  selectedIds: [],
  selectedType: null,
};

const initialNumbering: NumberingModeState = {
  active: false,
  treatmentId: null,
  counter: 0,
  autoSnakeApplied: false,
};

export function useLayoutEditor(currentUser: string) {
  const [mode, setMode] = useState<LayoutMode>("readonly");
  const [activeTool, setActiveToolState] = useState<EditTool>("none");
  const [selection, setSelection] = useState<SelectionState>(initialSelection);
  const [numbering, setNumbering] = useState<NumberingModeState>(initialNumbering);
  const [vinePopup, setVinePopup] = useState<VineEditorPopupState | null>(null);

  // ─── Modo global ───

  const enterEditMode = useCallback(() => setMode("edit"), []);
  const enterReadOnlyMode = useCallback(() => {
    setMode("readonly");
    setActiveToolState("none");
    setSelection(initialSelection);
  }, []);

  // ─── Herramienta activa ───
  // Cambiar de herramienta siempre limpia selección y numbering,
  // para evitar estados cruzados (ej: quedar "seleccionando" mientras
  // se entra a "numbering")

  const setActiveTool = useCallback((tool: EditTool) => {
    setActiveToolState(tool);
    setSelection(initialSelection);
    if (tool !== "numbering") {
      setNumbering(initialNumbering);
    }
  }, []);

  // ─── Selección múltiple (sección 10: solo permite eliminar en lote) ───

  const toggleSelectItem = useCallback(
    (id: string, type: "vine" | "object" | "text") => {
      setSelection((prev) => {
        // Selección homogénea: si se cambia de tipo, se reinicia
        if (prev.selectedType !== null && prev.selectedType !== type) {
          return { active: true, selectedIds: [id], selectedType: type };
        }
        const alreadySelected = prev.selectedIds.includes(id);
        const nextIds = alreadySelected
          ? prev.selectedIds.filter((existingId) => existingId !== id)
          : [...prev.selectedIds, id];
        return {
          active: true,
          selectedIds: nextIds,
          selectedType: nextIds.length > 0 ? type : null,
        };
      });
    },
    []
  );

  const clearSelection = useCallback(() => setSelection(initialSelection), []);

  // ─── Modo Numeración (sección 6) ───

  const startNumbering = useCallback((treatmentId: string) => {
    setNumbering({
      active: true,
      treatmentId,
      counter: 0,
      autoSnakeApplied: false,
    });
  }, []);

  const applyAutoSnake = useCallback(() => {
    setNumbering((prev) => ({ ...prev, autoSnakeApplied: true }));
  }, []);

  // Tap simple sobre una vine → suma +1 al contador (sección 6)
  const incrementCounter = useCallback(() => {
    setNumbering((prev) => ({ ...prev, counter: prev.counter + 1 }));
  }, []);

  // Mantener presionado → resetea el contador a 0 (sección 6)
  const resetCounter = useCallback(() => {
    setNumbering((prev) => ({ ...prev, counter: 0 }));
  }, []);

  const exitNumbering = useCallback(() => setNumbering(initialNumbering), []);

  // ─── Popup crear/editar vine (sección 4) ───

  const openCreateVinePopup = useCallback(
    (gridId: string, rowNumber: number, bayIndex: number, targetSlot?: 1 | 2 | 3) => {
      setVinePopup({
        open: true,
        mode: "create",
        gridId,
        rowNumber,
        bayIndex,
        targetSlot,
      });
    },
    []
  );

  const openEditVinePopup = useCallback(
    (gridId: string, rowNumber: number, bayIndex: number, existingVineId: string) => {
      setVinePopup({
        open: true,
        mode: "edit",
        gridId,
        rowNumber,
        bayIndex,
        existingVineId,
      });
    },
    []
  );

  const closeVinePopup = useCallback(() => setVinePopup(null), []);

  return {
    // estado
    mode,
    activeTool,
    selection,
    numbering,
    vinePopup,
    currentUser,
    // acciones
    enterEditMode,
    enterReadOnlyMode,
    setActiveTool,
    toggleSelectItem,
    clearSelection,
    startNumbering,
    applyAutoSnake,
    incrementCounter,
    resetCounter,
    exitNumbering,
    openCreateVinePopup,
    openEditVinePopup,
    closeVinePopup,
  };
}