"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

interface AppNavMenuProps {
  onOpenLayouts: () => void;
}

export function AppNavMenu({ onOpenLayouts }: AppNavMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function handleOpenLayouts() {
    closeMenu();
    onOpenLayouts();
  }

  function handleHome() {
    closeMenu();
    router.push("/");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label="Open navigation menu"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 sm:h-11 sm:w-11"
      >
        <span className="flex flex-col gap-1" aria-hidden="true">
          <span className="block h-0.5 w-4 rounded-full bg-current sm:w-5" />
          <span className="block h-0.5 w-4 rounded-full bg-current sm:w-5" />
          <span className="block h-0.5 w-4 rounded-full bg-current sm:w-5" />
        </span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg sm:w-60"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleHome}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Home
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleOpenLayouts}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Layouts
          </button>

          <Link
            href="/new-project"
            role="menuitem"
            onClick={closeMenu}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Create New Layout
          </Link>
        </div>
      )}
    </div>
  );
}
