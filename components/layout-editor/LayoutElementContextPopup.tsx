"use client";

const POPUP_WIDTH = 88;
const ROW_HEIGHT = 26;
const POPUP_HEIGHT = ROW_HEIGHT * 2;
const ANCHOR_GAP = 10;

interface LayoutElementContextPopupProps {
  anchorX: number;
  anchorY: number;
  anchorSize?: number;
  dataAttribute?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function LayoutElementContextPopup({
  anchorX,
  anchorY,
  anchorSize = 16,
  dataAttribute = "layout-element-popup",
  onEdit,
  onDelete,
}: LayoutElementContextPopupProps) {
  const popupX = anchorX - POPUP_WIDTH / 2;
  const popupBottomY = anchorY - anchorSize - ANCHOR_GAP;
  const popupY = popupBottomY - POPUP_HEIGHT;

  return (
    <g data-layout-element-popup={dataAttribute} pointerEvents="all">
      <rect
        x={popupX}
        y={popupY}
        width={POPUP_WIDTH}
        height={POPUP_HEIGHT}
        rx={6}
        fill="#FFFFFF"
        stroke="#D1D5DB"
        strokeWidth={1}
        filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))"
      />

      <rect
        x={popupX}
        y={popupY}
        width={POPUP_WIDTH}
        height={ROW_HEIGHT}
        fill="transparent"
        style={{ cursor: "pointer" }}
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
      />
      <text
        x={anchorX}
        y={popupY + ROW_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#374151"
        pointerEvents="none"
      >
        Edit
      </text>

      <line
        x1={popupX + 8}
        y1={popupY + ROW_HEIGHT}
        x2={popupX + POPUP_WIDTH - 8}
        y2={popupY + ROW_HEIGHT}
        stroke="#E5E7EB"
        strokeWidth={1}
        pointerEvents="none"
      />

      <rect
        x={popupX}
        y={popupY + ROW_HEIGHT}
        width={POPUP_WIDTH}
        height={ROW_HEIGHT}
        fill="transparent"
        style={{ cursor: "pointer" }}
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      />
      <text
        x={anchorX}
        y={popupY + ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#DC2626"
        pointerEvents="none"
      >
        Delete
      </text>

      <path
        d={`M ${anchorX - 6} ${popupBottomY} L ${anchorX} ${popupBottomY + 7} L ${anchorX + 6} ${popupBottomY} Z`}
        fill="#FFFFFF"
        stroke="#D1D5DB"
        strokeWidth={1}
        pointerEvents="none"
      />
    </g>
  );
}
