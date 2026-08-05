"use client";

import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-[#1f2a24]/90 px-3 py-1 text-xs font-medium text-white shadow-md"
      role="status"
      aria-live="polite"
    >
      Offline
    </div>
  );
}
