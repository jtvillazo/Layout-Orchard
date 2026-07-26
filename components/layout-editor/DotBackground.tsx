"use client";

import { ROW_SPACING, BAY_HEIGHT } from "@/lib/grid-geometry";

/**
 * Fondo de puntos del canvas infinito.
 * Ver comentario completo de diseño en la versión anterior de este archivo.
 */

// ─── Parámetros visuales — ajustá estos valores libremente ───
const DOT_RADIUS = 2.5;      // tamaño del punto
const DOT_OPACITY = 0.7;     // qué tan visible es (0 = invisible, 1 = sólido)
const DOT_COLOR = "#6B7280"; // color del punto (gris más oscuro que antes)

interface DotBackgroundProps {
  patternId?: string;
}

export function DotBackground({ patternId = "canvas-dot-grid" }: DotBackgroundProps) {
  return (
    <>
      <defs>
        <pattern
          id={patternId}
          // Desplazamos el tile medio paso (x, y negativos) para que el
          // punto quede CENTRADO dentro de su propio tile, no en el borde.
          // Así no lo recorta el navegador, y matemáticamente sigue
          // cayendo exacto en la esquina del bay (múltiplos de W y H).
          x={-ROW_SPACING / 2}
          y={-BAY_HEIGHT / 2}
          width={ROW_SPACING}
          height={BAY_HEIGHT}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={ROW_SPACING / 2}
            cy={BAY_HEIGHT / 2}
            r={DOT_RADIUS}
            fill={DOT_COLOR}
            opacity={DOT_OPACITY}
          />
        </pattern>
      </defs>
      <rect x={-100000} y={-100000} width={200000} height={200000} fill={`url(#${patternId})`} />
    </>
  );
}
