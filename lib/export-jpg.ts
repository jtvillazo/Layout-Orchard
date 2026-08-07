import { bayToPixel } from "@/lib/grid-geometry";
import type { ContentRect } from "@/lib/content-rect";
import { pointInContentRect } from "@/lib/content-rect";
import type { Grid, Treatment, UUID, Vine } from "@/types";

const VINE_HIT_MARGIN = 10;

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
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function measureFooterHeight(
  includeLayoutInfo: boolean,
  includeLegend: boolean,
  legendCount: number,
  layoutLineCount: number
): number {
  let height = 0;

  if (includeLayoutInfo) {
    height += 24 + layoutLineCount * 22 + 16;
  }

  if (includeLegend) {
    height += 24 + (legendCount > 0 ? legendCount * 26 + 8 : 22);
  }

  return height;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  startY: number,
  width: number,
  options: {
    includeLayoutInfo: boolean;
    includeLegend: boolean;
    projectName: string;
    projectLeader: string;
    orchardName: string;
    variety: string;
    treatments: Treatment[];
  }
) {
  let y = startY + 20;
  ctx.fillStyle = "#1f2a24";
  ctx.textBaseline = "top";

  if (options.includeLayoutInfo) {
    ctx.font = "600 16px Arial, Helvetica, sans-serif";
    ctx.fillText("Layout Information", 24, y);
    y += 24;

    ctx.font = "14px Arial, Helvetica, sans-serif";
    const lines = [
      `Project: ${options.projectName}`,
      `Leader: ${options.projectLeader}`,
      `Orchard: ${options.orchardName}`,
      `Variety: ${options.variety}`,
    ];

    lines.forEach((line) => {
      ctx.fillText(line, 24, y);
      y += 22;
    });

    y += 8;
  }

  if (options.includeLegend) {
    ctx.font = "600 16px Arial, Helvetica, sans-serif";
    ctx.fillText("Treatment Legend", 24, y);
    y += 24;

    if (options.treatments.length === 0) {
      ctx.font = "14px Arial, Helvetica, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("No treatments in selected area", 24, y);
      return;
    }

    ctx.font = "14px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#1f2a24";

    options.treatments.forEach((treatment) => {
      drawTreatmentSwatch(ctx, 24, y + 2, 18, treatment);
      ctx.fillText(treatment.name, 52, y + 1);
      y += 26;
    });
  }
}

export interface ExportLayoutJpgOptions {
  contentGroup: SVGGElement;
  bounds: ContentRect;
  filename: string;
  includeLegend: boolean;
  includeLayoutInfo: boolean;
  projectName: string;
  projectLeader: string;
  orchardName: string;
  variety: string;
  treatments: Treatment[];
}

export async function exportLayoutToJpeg(
  options: ExportLayoutJpgOptions
): Promise<void> {
  const patternId = `export-dot-grid-${Date.now()}`;
  const clone = options.contentGroup.cloneNode(true) as SVGGElement;
  rewriteDotPattern(clone, patternId);
  stripTransientUi(clone);

  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("xmlns", svgNamespace);
  svg.setAttribute(
    "viewBox",
    `${options.bounds.x} ${options.bounds.y} ${options.bounds.width} ${options.bounds.height}`
  );

  const scale = Math.min(4, Math.max(1.5, 2400 / options.bounds.width));
  const pixelWidth = Math.round(options.bounds.width * scale);
  const pixelHeight = Math.round(options.bounds.height * scale);
  svg.setAttribute("width", String(pixelWidth));
  svg.setAttribute("height", String(pixelHeight));
  svg.appendChild(clone);

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const layoutLineCount = options.includeLayoutInfo ? 4 : 0;
    const footerHeight = measureFooterHeight(
      options.includeLayoutInfo,
      options.includeLegend,
      options.treatments.length,
      layoutLineCount
    );

    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight + footerHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight);

    drawFooter(ctx, pixelHeight, pixelWidth, {
      includeLayoutInfo: options.includeLayoutInfo,
      includeLegend: options.includeLegend,
      projectName: options.projectName,
      projectLeader: options.projectLeader,
      orchardName: options.orchardName,
      variety: options.variety,
      treatments: options.treatments,
    });

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
