import { useEffect, useState } from "react";

const DEFAULT_BREAKPOINT_PX = 768;

export function useCompactViewport(breakpointPx = DEFAULT_BREAKPOINT_PX): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => setCompact(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [breakpointPx]);

  return compact;
}
