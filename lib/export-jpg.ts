import { bayToPixel } from "@/lib/grid-geometry";
import type { ContentRect } from "@/lib/content-rect";
import { pointInContentRect } from "@/lib/content-rect";
import type { Grid, Treatment, UUID, Vine } from "@/types";

const VINE_HIT_MARGIN = 10;

const PANEL_MIN_WIDTH = 340;
const PANEL_MAX_WIDTH = 520;
const PANEL_WIDTH_RATIO = 0.32;
const PANEL_PADDING = 28;
const SECTION_GAP = 24;
/** Fixed export typography — never scaled with layout size. */
const EXPORT_FONT_SIZE = 14;
const FIELD_BLOCK_GAP = 18;
const LEGEND_ROW_HEIGHT = 22;
const SWATCH_SIZE = 16;
const SWATCH_TEXT_GAP = 10;
const BODY_LINE_HEIGHT = 18;
const EXPORT_WHITE = "#FFFFFF";
const FONT_FAMILY = "Arial, Helvetica, sans-serif";

export function getVinesInContentRect(
  vines: Vine[],
  grids: Grid[],
  bounds: ContentRect
): Vine[] {
  const gridById = new Map(grids.map((grid) => [grid.id, grid]));
  const vinesByBayKey = new Map<string, Vine[]>();

  for (const vine of vines) {
    const key = `${vine.gridId}|${vine.rowNumber}|${vine.bayIndex}`;
    const group = vinesByBayKey.get(key) ?? [];
    group.push(vine);
    vinesByBayKey.set(key, group);
  }

  return vines.filter((vine) => {
    const grid = gridById.get(vine.gridId);
    if (!grid) {
      return false;
    }

    const bayKey = `${vine.gridId}|${vine.rowNumber}|${vine.bayIndex}`;
    const vinesInBay = vinesByBayKey.get(bayKey) ?? [vine];
    const point = bayToPixel(
      grid,
      vine.rowNumber,
      vine.bayIndex,
      vine.slot,
      vinesInBay
    );

    return pointInContentRect(point.x, point.y, bounds, VINE_HIT_MARGIN);
  });
}

export function getTreatmentsForVines(
  treatments: Treatment[],
  vines: Vine[]
): Treatment[] {
  const treatmentIds = new Set<UUID>();
  vines.forEach((vine) => {
    if (vine.treatmentId) {
      treatmentIds.add(vine.treatmentId);
    }
  });

  return treatments
    .filter((treatment) => treatmentIds.has(treatment.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function rewriteDotPattern(clone: SVGGElement, patternId: string) {
  const pattern = clone.querySelector("pattern");
  if (pattern) {
    pattern.setAttribute("id", patternId);
  }

  const background = clone.querySelector('rect[fill^="url(#"]');
  if (background) {
    background.setAttribute("fill", `url(#${patternId})`);
  }
}

function stripDotBackground(clone: SVGGElement) {
  clone.querySelectorAll('rect[fill^="url(#"]').forEach((node) => {
    node.remove();
  });
  clone.querySelectorAll("pattern").forEach((node) => {
    node.remove();
  });
}

function stripTransientUi(clone: SVGGElement) {
  clone.querySelectorAll("circle[stroke-dasharray]").forEach((node) => {
    node.remove();
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to render layout SVG."));
    image.src = url;
  });
}

function computePanelWidth(layoutPixelWidth: number): number {
  const proportional = Math.round(layoutPixelWidth * PANEL_WIDTH_RATIO);
  return Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, proportional));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const next = `${current} ${words[index]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[index];
    }
  }

  lines.push(current);
  return lines;
}

function drawTreatmentSwatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  treatment: Treatment
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (treatment.color2) {
    ctx.fillStyle = treatment.color;
    ctx.fillRect(x, y, size, size / 2);
    ctx.fillStyle = treatment.color2;
    ctx.fillRect(x, y + size / 2, size, size / 2);
  } else {
    ctx.fillStyle = treatment.color;
    ctx.fillRect(x, y, size, size);
  }

  ctx.restore();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

interface SidePanelContentOptions {
  includeLayoutInfo: boolean;
  includeLegend: boolean;
  projectName: string;
  projectLeader: string;
  orchardName: string;
  variety: string;
  treatments: Treatment[];
}

function measureSidePanelContentHeight(
  ctx: CanvasRenderingContext2D,
  panelWidth: number,
  options: SidePanelContentOptions
): number {
  const contentWidth = panelWidth - PANEL_PADDING * 2;
  let height = PANEL_PADDING;

  if (options.includeLayoutInfo) {
    height += EXPORT_FONT_SIZE + 16;
    const fields = [
      { label: "Project", value: options.projectName },
      { label: "Leader", value: options.projectLeader },
      { label: "Orchard", value: options.orchardName },
      { label: "Variety", value: options.variety },
    ];

    ctx.font = `${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
    fields.forEach((field) => {
      height += EXPORT_FONT_SIZE + 4;
      const lines = wrapText(ctx, field.value, contentWidth);
      height += lines.length * FIELD_BLOCK_GAP;
    });

    if (options.includeLegend) {
      height += SECTION_GAP;
    }
  }

  if (options.includeLegend) {
    height += EXPORT_FONT_SIZE + 16;

    if (options.treatments.length === 0) {
      height += BODY_LINE_HEIGHT;
    } else {
      ctx.font = `${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
      const textStart = PANEL_PADDING + SWATCH_SIZE + SWATCH_TEXT_GAP;

      options.treatments.forEach((treatment) => {
        const lines = wrapText(
          ctx,
          treatment.name,
          panelWidth - textStart - PANEL_PADDING
        );
        height += Math.max(
          LEGEND_ROW_HEIGHT,
          lines.length * (EXPORT_FONT_SIZE + 4)
        );
      });
    }
  }

  height += PANEL_PADDING;
  return height;
}

function drawSectionTitle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string
) {
  ctx.fillStyle = "#2f4034";
  ctx.font = `700 ${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(title.toUpperCase(), x, y);

  const underlineY = y + EXPORT_FONT_SIZE + 6;
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, underlineY);
  ctx.lineTo(x + ctx.measureText(title.toUpperCase()).width, underlineY);
  ctx.stroke();

  return underlineY + 16;
}

function drawFieldBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxWidth: number,
  label: string,
  value: string
): number {
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 ${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(label, x, y);

  let currentY = y + EXPORT_FONT_SIZE + 4;
  ctx.fillStyle = "#1f2a24";
  ctx.font = `${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;

  wrapText(ctx, value, maxWidth).forEach((line) => {
    ctx.fillText(line, x, currentY);
    currentY += FIELD_BLOCK_GAP;
  });

  return currentY + 4;
}

function drawSidePanel(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelWidth: number,
  panelHeight: number,
  options: SidePanelContentOptions
) {
  ctx.fillStyle = EXPORT_WHITE;
  ctx.fillRect(panelX, 0, panelWidth, panelHeight);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX + 1, 0);
  ctx.lineTo(panelX + 1, panelHeight);
  ctx.stroke();

  const contentX = panelX + PANEL_PADDING;
  const contentWidth = panelWidth - PANEL_PADDING * 2;
  let y = PANEL_PADDING;

  if (options.includeLayoutInfo) {
    y = drawSectionTitle(ctx, contentX, y, "Project Information");

    y = drawFieldBlock(
      ctx,
      contentX,
      y,
      contentWidth,
      "Project",
      options.projectName
    );
    y = drawFieldBlock(
      ctx,
      contentX,
      y,
      contentWidth,
      "Leader",
      options.projectLeader
    );
    y = drawFieldBlock(
      ctx,
      contentX,
      y,
      contentWidth,
      "Orchard",
      options.orchardName
    );
    y = drawFieldBlock(
      ctx,
      contentX,
      y,
      contentWidth,
      "Variety",
      options.variety
    );

    if (options.includeLegend) {
      y += SECTION_GAP - 4;
    }
  }

  if (options.includeLegend) {
    y = drawSectionTitle(ctx, contentX, y, "Treatment Legend");

    if (options.treatments.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = `${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.fillText("No treatments in selected area", contentX, y);
      return;
    }

    ctx.font = `${EXPORT_FONT_SIZE}px ${FONT_FAMILY}`;
    const textX = contentX + SWATCH_SIZE + SWATCH_TEXT_GAP;
    const textMaxWidth =
      panelWidth - PANEL_PADDING * 2 - SWATCH_SIZE - SWATCH_TEXT_GAP;

    options.treatments.forEach((treatment) => {
      const swatchY = y + (LEGEND_ROW_HEIGHT - SWATCH_SIZE) / 2;
      drawTreatmentSwatch(ctx, contentX, swatchY, SWATCH_SIZE, treatment);

      ctx.fillStyle = "#1f2a24";
      const lines = wrapText(ctx, treatment.name, textMaxWidth);
      let lineY = y + 6;

      lines.forEach((line) => {
        ctx.fillText(line, textX, lineY);
        lineY += EXPORT_FONT_SIZE + 4;
      });

      y += Math.max(LEGEND_ROW_HEIGHT, lines.length * (EXPORT_FONT_SIZE + 4));
    });
  }
}

export interface ExportLayoutJpgOptions {
  contentGroup: SVGGElement;
  bounds: ContentRect;
  filename: string;
  includeLegend: boolean;
  includeLayoutInfo: boolean;
  showGridPoints: boolean;
  projectName: string;
  projectLeader: string;
  orchardName: string;
  variety: string;
  treatments: Treatment[];
}

export async function exportLayoutToJpeg(
  options: ExportLayoutJpgOptions
): Promise<void> {
  const clone = options.contentGroup.cloneNode(true) as SVGGElement;
  stripTransientUi(clone);

  if (options.showGridPoints) {
    rewriteDotPattern(clone, `export-dot-grid-${Date.now()}`);
  } else {
    stripDotBackground(clone);
  }

  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("xmlns", svgNamespace);
  svg.setAttribute(
    "viewBox",
    `${options.bounds.x} ${options.bounds.y} ${options.bounds.width} ${options.bounds.height}`
  );

  const scale = Math.min(4, Math.max(1.5, 2400 / options.bounds.width));
  const layoutPixelWidth = Math.round(options.bounds.width * scale);
  const layoutPixelHeight = Math.round(options.bounds.height * scale);
  svg.setAttribute("width", String(layoutPixelWidth));
  svg.setAttribute("height", String(layoutPixelHeight));

  const whiteBackground = document.createElementNS(svgNamespace, "rect");
  whiteBackground.setAttribute("x", String(options.bounds.x));
  whiteBackground.setAttribute("y", String(options.bounds.y));
  whiteBackground.setAttribute("width", String(options.bounds.width));
  whiteBackground.setAttribute("height", String(options.bounds.height));
  whiteBackground.setAttribute("fill", EXPORT_WHITE);
  svg.appendChild(whiteBackground);
  svg.appendChild(clone);

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const hasSidePanel = options.includeLayoutInfo || options.includeLegend;
    const panelWidth = hasSidePanel
      ? computePanelWidth(layoutPixelWidth)
      : 0;

    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) {
      throw new Error("Canvas is not available.");
    }

    const panelContentHeight = hasSidePanel
      ? measureSidePanelContentHeight(measureCtx, panelWidth, options)
      : 0;

    const canvas = document.createElement("canvas");
    canvas.width = layoutPixelWidth + panelWidth;
    canvas.height = Math.max(layoutPixelHeight, panelContentHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available.");
    }

    ctx.fillStyle = EXPORT_WHITE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, layoutPixelWidth, layoutPixelHeight);

    if (hasSidePanel) {
      drawSidePanel(
        ctx,
        layoutPixelWidth,
        panelWidth,
        canvas.height,
        options
      );
    }

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to encode JPG."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.92
      );
    });

    const safeName =
      options.filename.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").replace(/\.jpe?g$/i, "") ||
      "Layout export";
    const downloadUrl = URL.createObjectURL(jpegBlob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = `${safeName}.jpg`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
