"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PixelPoint } from "@/lib/grid-geometry";
import { screenClientToContentPoint } from "@/lib/viewport";
import { DotBackground } from "./DotBackground";

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_ZOOM_WIDTH = 150;
const MAX_ZOOM_WIDTH = 4000;
const DRAG_THRESHOLD = 6;
const LONG_PRESS_DURATION = 600;

interface CanvasProps {
  children: React.ReactNode;
  initialViewBox?: ViewBox;
  onLongPress?: (clientX: number, clientY: number, point: PixelPoint | null) => void;
  onSurfaceClick?: (target: Element | null, clientX: number, clientY: number) => void;
}

type ScreenPoint = { x: number; y: number };

const NO_SELECT_STYLE: React.CSSProperties = {
  WebkitTouchCallout: "none",
  WebkitUserSelect: "none",
  userSelect: "none",
};

export function Canvas({
  children,
  initialViewBox = { x: -450, y: -1000, width: 1500, height: 1850 },
  onLongPress,
  onSurfaceClick,
}: CanvasProps) {
  const [viewBox, setViewBox] = useState<ViewBox>(initialViewBox);
  const [rotation, setRotation] = useState(0);
  // Pivote de rotación fijo en el mundo: se calcula una sola vez a partir del
  // viewBox inicial y NUNCA se recalcula durante el pan. Si el pivote siguiera
  // al viewBox (como antes), pan + rotación quedan acoplados y un drag en
  // pantalla termina desplazando el contenido en una dirección rotada.
  const [pivot, setPivot] = useState({
    x: initialViewBox.x + initialViewBox.width / 2,
    y: initialViewBox.y + initialViewBox.height / 2,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const contentGroupRef = useRef<SVGGElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const initialViewBoxRef = useRef(initialViewBox);
  const activeTouches = useRef<Map<number, ScreenPoint>>(new Map());
  const lastPinchDistance = useRef<number | null>(null);
  const lastPinchAngle = useRef<number | null>(null);
  const isMouseDragging = useRef(false);
  const rotateWithPointer = useRef(false);
  const gestureMoved = useRef(false);
  const touchGestureActive = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const longPressStartPosition = useRef<ScreenPoint | null>(null);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;
  const onSurfaceClickRef = useRef(onSurfaceClick);
  onSurfaceClickRef.current = onSurfaceClick;

  const viewBoxRef = useRef(viewBox);
  viewBoxRef.current = viewBox;

  const getViewBoxScale = useCallback(() => {
    if (!svgRef.current) return { scaleX: 1, scaleY: 1 };
    const rect = svgRef.current.getBoundingClientRect();
    const vb = viewBoxRef.current;
    return {
      scaleX: vb.width / rect.width,
      scaleY: vb.height / rect.height,
    };
  }, []);

  const applyPan = useCallback((dxScreen: number, dyScreen: number) => {
    if (dxScreen === 0 && dyScreen === 0) return;
    const { scaleX, scaleY } = getViewBoxScale();
    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dxScreen * scaleX,
      y: prev.y - dyScreen * scaleY,
    }));
  }, [getViewBoxScale]);

  const applyZoom = useCallback((zoomFactor: number, screenPoint: ScreenPoint) => {
    if (!svgRef.current) return;

    setViewBox((prev) => {
      const newWidth = prev.width * zoomFactor;
      const newHeight = prev.height * zoomFactor;

      if (newWidth < MIN_ZOOM_WIDTH || newWidth > MAX_ZOOM_WIDTH) return prev;

      const svgRect = svgRef.current!.getBoundingClientRect();
      const pointRatioX = (screenPoint.x - svgRect.left) / svgRect.width;
      const pointRatioY = (screenPoint.y - svgRect.top) / svgRect.height;

      const canvasPointX = prev.x + pointRatioX * prev.width;
      const canvasPointY = prev.y + pointRatioY * prev.height;

      return {
        x: canvasPointX - pointRatioX * newWidth,
        y: canvasPointY - pointRatioY * newHeight,
        width: newWidth,
        height: newHeight,
      };
    });
  }, []);

  const applyRotationDelta = useCallback((deltaDegrees: number) => {
    if (deltaDegrees === 0) return;
    setRotation((prev) => prev + deltaDegrees);
  }, []);

  const gestureApi = useRef({
    applyPan,
    applyZoom,
    applyRotationDelta,
    applyTwoFingerGesture: (
      _points: ScreenPoint[],
      _prevDist: number | null,
      _prevAngle: number | null
    ) => {},
    forwardClick: (_x: number, _y: number) => {},
  });

  const applyTwoFingerGesture = useCallback(
    (points: ScreenPoint[], previousDistance: number | null, previousAngle: number | null) => {
      const newDistance = getDistance(points[0], points[1]);
      const newAngle = getAngle(points[0], points[1]);
      const midpoint = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      };

      if (previousDistance !== null && previousDistance > 0) {
        const zoomFactor = previousDistance / newDistance;
        applyZoom(zoomFactor, midpoint);
      }

      if (previousAngle !== null) {
        const deltaDegrees = ((newAngle - previousAngle) * 180) / Math.PI;
        applyRotationDelta(deltaDegrees);
      }

      lastPinchDistance.current = newDistance;
      lastPinchAngle.current = newAngle;
    },
    [applyZoom, applyRotationDelta]
  );

  const forwardClick = useCallback((clientX: number, clientY: number) => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.style.pointerEvents = "none";
    const target = document.elementFromPoint(clientX, clientY);
    overlay.style.pointerEvents = "auto";

    onSurfaceClickRef.current?.(target, clientX, clientY);

    if (target) {
      target.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          view: window,
        })
      );
    }
  }, []);

  gestureApi.current = {
    applyPan,
    applyZoom,
    applyRotationDelta,
    applyTwoFingerGesture,
    forwardClick,
  };

  const handleReset = useCallback(() => {
    const initial = initialViewBoxRef.current;
    setViewBox(initial);
    setRotation(0);
    setPivot({
      x: initial.x + initial.width / 2,
      y: initial.y + initial.height / 2,
    });
  }, []);

  const initPinchFromTouches = (touches: TouchList) => {
    if (touches.length < 2) return;
    const p0 = { x: touches[0].clientX, y: touches[0].clientY };
    const p1 = { x: touches[1].clientX, y: touches[1].clientY };
    lastPinchDistance.current = getDistance(p0, p1);
    lastPinchAngle.current = getAngle(p0, p1);
  };

  const clearPinch = () => {
    lastPinchDistance.current = null;
    lastPinchAngle.current = null;
  };

  const syncActiveTouches = (touches: TouchList) => {
    activeTouches.current.clear();
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      activeTouches.current.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const cancelLongPress = (reason?: string, silent = false) => {
    if (
      !silent &&
      (longPressTimer.current !== null || longPressStartPosition.current !== null)
    ) {
      console.log("[LONG PRESS] cancelled", reason ?? "");
    }
    clearLongPressTimer();
    longPressStartPosition.current = null;
  };

  const fireLongPress = (clientX: number, clientY: number) => {
    console.log("[LONG PRESS] TRIGGERED");
    const svg = svgRef.current;
    const contentGroup = contentGroupRef.current;
    const point =
      svg && contentGroup
        ? screenClientToContentPoint(svg, contentGroup, clientX, clientY)
        : null;
    onLongPressRef.current?.(clientX, clientY, point);
    longPressTriggered.current = true;
  };

  const startLongPressTimerAt = (
    startPos: ScreenPoint,
    getCurrentPosition: () => ScreenPoint
  ) => {
    clearLongPressTimer();
    longPressStartPosition.current = startPos;
    console.log("[LONG PRESS] timer started");
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      const current = getCurrentPosition();
      fireLongPress(current.x, current.y);
    }, LONG_PRESS_DURATION);
  };

  // ─── Touch nativo + bloqueo de scroll iOS ───

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const html = document.documentElement;
    const body = document.body;
    const saved = {
      htmlOverflow: html.style.overflow,
      htmlTouchAction: html.style.touchAction,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTouchAction: body.style.touchAction,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
    };

    html.style.overflow = "hidden";
    html.style.touchAction = "none";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.touchAction = "none";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.top = "0";
    body.style.left = "0";

    const isInsideCanvas = (target: EventTarget | null) =>
      target instanceof Node && container.contains(target);

    const preventBrowserGesture = (e: TouchEvent) => {
      if (touchGestureActive.current || isInsideCanvas(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", preventBrowserGesture, { passive: false, capture: true });
    document.addEventListener("touchmove", preventBrowserGesture, { passive: false, capture: true });

    const onTouchStart = (e: TouchEvent) => {
      if (!isInsideCanvas(e.target)) return;

      e.preventDefault();
      e.stopPropagation();
      touchGestureActive.current = true;
      gestureMoved.current = false;
      longPressTriggered.current = false;

      console.log("[LONG PRESS] touch start", {
        touches: e.touches.length,
        target: e.target instanceof Element ? e.target.tagName : e.target,
        hasOnLongPress: typeof onLongPressRef.current === "function",
      });

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        activeTouches.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
      }

      if (e.touches.length >= 2) {
        cancelLongPress("second finger");
        if (e.touches.length === 2) initPinchFromTouches(e.touches);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        const startPos = { x: touch.clientX, y: touch.clientY };
        startLongPressTimerAt(startPos, () => {
          const activeTouch = activeTouches.current.values().next().value;
          return activeTouch ?? startPos;
        });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchGestureActive.current) return;

      e.preventDefault();
      e.stopPropagation();

      const { touches } = e;

      if (touches.length === 2) {
        cancelLongPress("second finger during move");
        const p0 = { x: touches[0].clientX, y: touches[0].clientY };
        const p1 = { x: touches[1].clientX, y: touches[1].clientY };
        gestureMoved.current = true;
        gestureApi.current.applyTwoFingerGesture(
          [p0, p1],
          lastPinchDistance.current,
          lastPinchAngle.current
        );
        syncActiveTouches(touches);
        return;
      }

      if (touches.length === 1) {
        const touch = touches[0];
        const longPressStart = longPressStartPosition.current;
        if (longPressStart) {
          const movedFromStart = Math.hypot(
            touch.clientX - longPressStart.x,
            touch.clientY - longPressStart.y
          );
          if (movedFromStart > DRAG_THRESHOLD) {
            cancelLongPress(`moved ${movedFromStart.toFixed(1)}px`);
          }
        }
        const previous = activeTouches.current.get(touch.identifier);
        if (previous) {
          const dx = touch.clientX - previous.x;
          const dy = touch.clientY - previous.y;
          if (Math.hypot(dx, dy) > 0) gestureMoved.current = true;
          gestureApi.current.applyPan(dx, dy);
        }
        activeTouches.current.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchGestureActive.current && !isInsideCanvas(e.target)) return;

      e.preventDefault();

      const wasTap = !gestureMoved.current && e.changedTouches.length === 1;

      for (let i = 0; i < e.changedTouches.length; i++) {
        activeTouches.current.delete(e.changedTouches[i].identifier);
      }

      if (e.touches.length === 0) {
        touchGestureActive.current = false;
        clearPinch();
      } else {
        syncActiveTouches(e.touches);
        if (e.touches.length === 2) initPinchFromTouches(e.touches);
        else clearPinch();
      }

      cancelLongPress("touch end", longPressTriggered.current);

      if (wasTap && !longPressTriggered.current) {
        const touch = e.changedTouches[0];
        gestureApi.current.forwardClick(touch.clientX, touch.clientY);
      }

      longPressTriggered.current = false;
      gestureMoved.current = false;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    container.addEventListener("touchend", onTouchEnd, { passive: false, capture: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: false, capture: true });

    return () => {
      cancelLongPress(undefined, true);
      document.removeEventListener("touchstart", preventBrowserGesture, { capture: true });
      document.removeEventListener("touchmove", preventBrowserGesture, { capture: true });
      container.removeEventListener("touchstart", onTouchStart, { capture: true });
      container.removeEventListener("touchmove", onTouchMove, { capture: true });
      container.removeEventListener("touchend", onTouchEnd, { capture: true });
      container.removeEventListener("touchcancel", onTouchEnd, { capture: true });

      html.style.overflow = saved.htmlOverflow;
      html.style.touchAction = saved.htmlTouchAction;
      html.style.height = saved.htmlHeight;
      body.style.overflow = saved.bodyOverflow;
      body.style.position = saved.bodyPosition;
      body.style.touchAction = saved.bodyTouchAction;
      body.style.width = saved.bodyWidth;
      body.style.height = saved.bodyHeight;
      body.style.top = saved.bodyTop;
      body.style.left = saved.bodyLeft;
    };
  }, []);

  // ─── Pointer events (mouse / trackpad) ───

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;

    rotateWithPointer.current = e.shiftKey;
    isMouseDragging.current = false;
    gestureMoved.current = false;
    longPressTriggered.current = false;

    const startPos = { x: e.clientX, y: e.clientY };
    activeTouches.current.set(e.pointerId, startPos);

    if (!e.shiftKey) {
      const pointerId = e.pointerId;
      startLongPressTimerAt(startPos, () => activeTouches.current.get(pointerId) ?? startPos);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;

      const previousPosition = activeTouches.current.get(e.pointerId);
      if (!previousPosition) return;

      const currentPosition = { x: e.clientX, y: e.clientY };
      const dx = currentPosition.x - previousPosition.x;
      const dy = currentPosition.y - previousPosition.y;

      const longPressStart = longPressStartPosition.current;
      if (longPressStart) {
        const movedFromStart = Math.hypot(
          currentPosition.x - longPressStart.x,
          currentPosition.y - longPressStart.y
        );
        if (movedFromStart > DRAG_THRESHOLD) {
          cancelLongPress(`moved ${movedFromStart.toFixed(1)}px`);
        }
      }

      if (!isMouseDragging.current && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        isMouseDragging.current = true;
        overlayRef.current?.setPointerCapture(e.pointerId);
      }

      if (!isMouseDragging.current) return;

      e.preventDefault();
      gestureMoved.current = true;
      activeTouches.current.set(e.pointerId, currentPosition);

      if (rotateWithPointer.current) {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const prevAngle = Math.atan2(previousPosition.y - centerY, previousPosition.x - centerX);
        const currAngle = Math.atan2(currentPosition.y - centerY, currentPosition.x - centerX);
        applyRotationDelta(((currAngle - prevAngle) * 180) / Math.PI);
        return;
      }

      applyPan(dx, dy);
    },
    [applyPan, applyRotationDelta]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;

      const triggeredLongPress = longPressTriggered.current;
      cancelLongPress("pointer up", triggeredLongPress);

      if (!gestureMoved.current && !rotateWithPointer.current && !triggeredLongPress) {
        forwardClick(e.clientX, e.clientY);
      }

      activeTouches.current.delete(e.pointerId);
      isMouseDragging.current = false;
      rotateWithPointer.current = false;
      gestureMoved.current = false;
      longPressTriggered.current = false;

      if (overlayRef.current?.hasPointerCapture(e.pointerId)) {
        overlayRef.current.releasePointerCapture(e.pointerId);
      }
    },
    [forwardClick]
  );

  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (!activeTouches.current.has(e.pointerId)) return;

    cancelLongPress("pointer leave", longPressTriggered.current);

    activeTouches.current.delete(e.pointerId);
    isMouseDragging.current = false;
    rotateWithPointer.current = false;
    gestureMoved.current = false;
    longPressTriggered.current = false;

    if (overlayRef.current?.hasPointerCapture(e.pointerId)) {
      overlayRef.current.releasePointerCapture(e.pointerId);
    }
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.shiftKey) {
        applyRotationDelta(e.deltaY > 0 ? 4 : -4);
        return;
      }
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      applyZoom(zoomFactor, { x: e.clientX, y: e.clientY });
    },
    [applyZoom, applyRotationDelta]
  );

  const isDefaultView =
    rotation === 0 &&
    viewBox.x === initialViewBoxRef.current.x &&
    viewBox.y === initialViewBoxRef.current.y &&
    viewBox.width === initialViewBoxRef.current.width &&
    viewBox.height === initialViewBoxRef.current.height;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        overscrollBehavior: "none",
        WebkitOverflowScrolling: "auto",
        ...NO_SELECT_STYLE,
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        width="100%"
        height="100%"
        style={{ display: "block", pointerEvents: "none", ...NO_SELECT_STYLE }}
      >
        <g ref={contentGroupRef} transform={`rotate(${rotation} ${pivot.x} ${pivot.y})`}>
          <DotBackground />
          {children}
        </g>
      </svg>

      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          touchAction: "none",
          cursor: "grab",
          WebkitTapHighlightColor: "transparent",
          ...NO_SELECT_STYLE,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={handleReset}
        disabled={isDefaultView}
        aria-label="Restablecer vista"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 10,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #D1D5DB",
          background: isDefaultView ? "#F3F4F6" : "#FFFFFF",
          color: isDefaultView ? "#9CA3AF" : "#374151",
          fontSize: 13,
          fontWeight: 500,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          cursor: isDefaultView ? "default" : "pointer",
          touchAction: "manipulation",
          ...NO_SELECT_STYLE,
        }}
      >
        Restablecer vista
      </button>
    </div>
  );
}

function getDistance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getAngle(a: ScreenPoint, b: ScreenPoint): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}
