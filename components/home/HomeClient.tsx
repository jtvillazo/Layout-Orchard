"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getLayoutEditorPath } from "@/lib/layout-list-utils";
import { getAllProjects } from "@/lib/project-store";
import type { ProjectData } from "@/lib/storage/project-data";

import { LayoutListModal } from "./LayoutListModal";
import { RecentLayouts } from "./RecentLayouts";

type LayoutModalMode = "open" | "view-all" | null;

export function HomeClient() {
  const router = useRouter();
  const [layouts, setLayouts] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<LayoutModalMode>(null);

  const loadLayouts = useCallback(async () => {
    try {
      const projects = await getAllProjects();
      setLayouts(projects);
    } catch (error) {
      console.error("[home] Failed to load layouts", error);
      setLayouts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLayouts();
  }, [loadLayouts]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadLayouts();
      }
    }

    window.addEventListener("focus", loadLayouts);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", loadLayouts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadLayouts]);

  function openLayout(layoutId: string) {
    setModalMode(null);
    router.push(getLayoutEditorPath(layoutId));
  }

  const modalTitle =
    modalMode === "view-all" ? "All layouts" : "Open layout";

  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#1f2a24]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8 sm:py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Layout Orchard
          </h1>
          <p className="text-sm text-gray-500">Orchard layout management</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-white sm:px-4"
          >
            Settings
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce5dc] text-sm font-medium">
            JV
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-8 sm:pt-16 sm:pb-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#66806b] sm:mb-4 sm:text-sm">
            Orchard management
          </p>

          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Design your orchard.
            <br />
            <span className="text-[#66806b]">Keep it organised.</span>
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8">
            Create, visualise and manage your orchard layouts in one place.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
            <Link
              href="/new-project"
              className="rounded-xl bg-[#2f4034] px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-[#243329]"
            >
              + New Project
            </Link>

            <button
              type="button"
              onClick={() => setModalMode("open")}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Open Layout
            </button>
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20">
          <p className="text-sm text-gray-500">Loading layouts...</p>
        </section>
      ) : (
        <RecentLayouts
          layouts={layouts}
          onOpenLayout={openLayout}
          onViewAll={() => setModalMode("view-all")}
        />
      )}

      {modalMode !== null && (
        <LayoutListModal
          title={modalTitle}
          layouts={layouts}
          onClose={() => setModalMode(null)}
          onOpenLayout={openLayout}
        />
      )}
    </main>
  );
}
