export const LABEL_BG_PADDING = 1;
export const LABEL_BG_OPACITY = 0.5;

export function getLabelBackgroundBounds(
  anchorX: number,
  anchorY: number,
  content: string,
  fontSize: number,
  verticalAlign: "middle" | "baseline" = "middle",
  padding = LABEL_BG_PADDING
) {
  const textWidth = Math.max(fontSize * 0.8, content.length * fontSize * 0.52);
  const textHeight = fontSize * 1;
  const topY =
    verticalAlign === "middle"
      ? anchorY - textHeight / 2
      : anchorY - textHeight * 0.9;

  return {
    x: anchorX - textWidth / 2 - padding,
    y: topY - padding,
    width: textWidth + padding * 2,
    height: textHeight + padding * 1,
    rx: 2,
  };
}
