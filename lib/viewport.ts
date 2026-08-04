export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ScreenPoint = { x: number; y: number };

export const MIN_ZOOM_WIDTH = 150;
export const MAX_ZOOM_WIDTH = 4000;

/** Screen-space scale factor derived from the current viewBox and stage size. */
export function getViewBoxScale(viewBox: ViewBox, stageWidth: number, stageHeight: number) {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return { scaleX: 1, scaleY: 1, scale: 1 };
  }

  return {
    scaleX: viewBox.width / stageWidth,
    scaleY: viewBox.height / stageHeight,
    scale: stageWidth / viewBox.width,
  };
}

export function applyPanToViewBox(
  viewBox: ViewBox,
  dxScreen: number,
  dyScreen: number,
  stageWidth: number,
  stageHeight: number
): ViewBox {
  if (dxScreen === 0 && dyScreen === 0) return viewBox;

  const { scaleX, scaleY } = getViewBoxScale(viewBox, stageWidth, stageHeight);
  return {
    ...viewBox,
    x: viewBox.x - dxScreen * scaleX,
    y: viewBox.y - dyScreen * scaleY,
  };
}

export function applyZoomToViewBox(
  viewBox: ViewBox,
  zoomFactor: number,
  screenPoint: ScreenPoint,
  stageRect: DOMRect
): ViewBox {
  const newWidth = viewBox.width * zoomFactor;
  const newHeight = viewBox.height * zoomFactor;

  if (newWidth < MIN_ZOOM_WIDTH || newWidth > MAX_ZOOM_WIDTH) return viewBox;

  const pointRatioX = (screenPoint.x - stageRect.left) / stageRect.width;
  const pointRatioY = (screenPoint.y - stageRect.top) / stageRect.height;

  const canvasPointX = viewBox.x + pointRatioX * viewBox.width;
  const canvasPointY = viewBox.y + pointRatioY * viewBox.height;

  return {
    x: canvasPointX - pointRatioX * newWidth,
    y: canvasPointY - pointRatioY * newHeight,
    width: newWidth,
    height: newHeight,
  };
}

export function getViewBoxPivot(viewBox: ViewBox) {
  return {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };
}

export function isDefaultView(
  viewBox: ViewBox,
  rotation: number,
  initialViewBox: ViewBox
) {
  return (
    rotation === 0 &&
    viewBox.x === initialViewBox.x &&
    viewBox.y === initialViewBox.y &&
    viewBox.width === initialViewBox.width &&
    viewBox.height === initialViewBox.height
  );
}

/** Convert a screen point to stage-local coordinates for Konva hit testing. */
export function screenToStagePoint(screenPoint: ScreenPoint, stageRect: DOMRect): ScreenPoint {
  return {
    x: screenPoint.x - stageRect.left,
    y: screenPoint.y - stageRect.top,
  };
}

/**
 * Maps a screen/client point to SVG content coordinates (inside the rotated
 * content group), inverting the current viewBox + transform stack.
 */
export function screenClientToContentPoint(
  svg: SVGSVGElement,
  contentGroup: SVGGElement,
  clientX: number,
  clientY: number
): ScreenPoint | null {
  const inverse = contentGroup.getScreenCTM()?.inverse();
  if (!inverse) return null;

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const local = pt.matrixTransform(inverse);

  return { x: local.x, y: local.y };
}
