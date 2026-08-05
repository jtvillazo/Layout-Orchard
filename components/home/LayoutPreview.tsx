import { buildLayoutPreviewShape } from "@/lib/layout-preview-bounds";
import type { ProjectData } from "@/lib/storage/project-data";

interface LayoutPreviewProps {
  data: ProjectData;
  className?: string;
}

function GenericPreview() {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 sm:gap-2">
      {Array.from({ length: 24 }).map((_, index) => (
        <div
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-[#66806b]/70 sm:h-2 sm:w-2"
        />
      ))}
    </div>
  );
}

export function LayoutPreview({ data, className = "" }: LayoutPreviewProps) {
  const shape = buildLayoutPreviewShape(data);

  if (!shape.bounds || shape.gridLines.length === 0) {
    return (
      <div
        className={`flex h-full min-h-[5.5rem] items-center justify-center rounded-xl bg-[#eef1eb] sm:min-h-[6.5rem] ${className}`}
      >
        <GenericPreview />
      </div>
    );
  }

  const { minX, minY, maxX, maxY } = shape.bounds;
  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);
  const viewBox = `${minX} ${minY} ${width} ${height}`;

  return (
    <div
      className={`flex h-full min-h-[5.5rem] items-center justify-center overflow-hidden rounded-xl bg-[#eef1eb] sm:min-h-[6.5rem] ${className}`}
    >
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {shape.gridLines.map((line, index) => (
          <line
            key={`grid-line-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#66806b"
            strokeWidth={Math.max(width * 0.012, 2)}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
        {shape.vineDots.map((dot, index) => (
          <circle
            key={`vine-${index}`}
            cx={dot.cx}
            cy={dot.cy}
            r={Math.max(width * 0.008, 2.5)}
            fill="#2f4034"
          />
        ))}
        {shape.objectDots.map((dot, index) => (
          <rect
            key={`object-${index}`}
            x={dot.cx - Math.max(width * 0.007, 2)}
            y={dot.cy - Math.max(width * 0.007, 2)}
            width={Math.max(width * 0.014, 4)}
            height={Math.max(width * 0.014, 4)}
            fill="#9CA3AF"
            rx={1}
          />
        ))}
      </svg>
    </div>
  );
}
