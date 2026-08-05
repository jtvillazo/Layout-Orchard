"use client";

import type { ProjectData } from "@/lib/storage/project-data";

import { getRecentLayouts } from "@/lib/layout-list-utils";

import { LayoutCard } from "./LayoutCard";

interface RecentLayoutsProps {
  layouts: ProjectData[];
  onOpenLayout: (layoutId: string) => void;
  onViewAll: () => void;
}

export function RecentLayouts({
  layouts,
  onOpenLayout,
  onViewAll,
}: RecentLayoutsProps) {
  const recentLayouts = getRecentLayouts(layouts, 5);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20">
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
        <div>
          <h3 className="text-lg font-semibold sm:text-xl">Recent layouts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Continue working on your orchards.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 text-sm font-medium text-[#66806b] hover:underline"
        >
          View all →
        </button>
      </div>

      {recentLayouts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-gray-700">No layouts yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a layout to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {recentLayouts.map((layout) => (
            <LayoutCard
              key={layout.layout.id}
              data={layout}
              onOpen={onOpenLayout}
            />
          ))}
        </div>
      )}
    </section>
  );
}
