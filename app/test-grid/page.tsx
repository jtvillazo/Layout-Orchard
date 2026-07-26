"use client";

import { Canvas } from "@/components/layout-editor/Canvas";
import { GridView } from "@/components/layout-editor/GridView";
import { mockGrid1, mockVines, mockTreatments, mockRows } from "@/lib/mock-data";

export default function TestGridPage() {
  const rowLabels: Record<number, string> = {};
  mockRows
    .filter((row) => row.gridId === mockGrid1.id)
    .forEach((row) => {
      if (row.label) rowLabels[row.index] = row.label;
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#F9FAFB",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <Canvas>
        <GridView
          grid={mockGrid1}
          vines={mockVines.filter((v) => v.gridId === mockGrid1.id)}
          treatments={mockTreatments}
          rowLabels={rowLabels}
          onVineClick={(vine) => console.log("Click en vine:", vine.id)}
        />
      </Canvas>
    </div>
  );
}
