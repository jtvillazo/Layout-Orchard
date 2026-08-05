import type { ProjectData } from "@/lib/storage/project-data";

import { LayoutPreview } from "./LayoutPreview";

interface LayoutCardProps {
  data: ProjectData;
  onOpen: (layoutId: string) => void;
}

export function LayoutCard({ data, onOpen }: LayoutCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(data.layout.id)}
      className="group w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition active:scale-[0.99] sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-md"
    >
      <div className="mb-4 h-28 sm:mb-5 sm:h-36">
        <LayoutPreview data={data} className="h-full" />
      </div>

      <div>
        <h4 className="truncate font-medium text-[#1f2a24]">
          {data.project.name}
        </h4>
        <p className="mt-1 truncate text-sm text-gray-500">{data.orchard.name}</p>
        <p className="mt-1 truncate text-sm text-gray-500">
          {data.project.projectLeader}
        </p>
      </div>
    </button>
  );
}
