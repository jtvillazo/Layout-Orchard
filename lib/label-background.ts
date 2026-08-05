export const LABEL_BG_PADDING = 2;
export const LABEL_BG_OPACITY = 1;

export function getLabelBackgroundBounds(
  anchorX: number,
  anchorY: number,
  content: string,
  fontSize: number,
  verticalAlign: "middle" | "baseline" = "middle",
  padding = LABEL_BG_PADDING
) {
  const textWidth = Math.max(fontSize * 0.8, content.length * fontSize * 0.52);
  const textHeight = fontSize * 1.2;
  const topY =
    verticalAlign === "middle"
      ? anchorY - textHeight / 2
      : anchorY - textHeight * 0.85;

  return {
    x: anchorX - textWidth / 2 - padding,
    y: topY - padding,
    width: textWidth + padding * 2,
    height: textHeight + padding * 2,
    rx: 2,
  };
}
