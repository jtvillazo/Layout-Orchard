import type { ProjectData } from "@/lib/storage/project-data";

interface LayoutListItemProps {
  data: ProjectData;
  onOpen: (layoutId: string) => void;
}

export function LayoutListItem({ data, onOpen }: LayoutListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(data.layout.id)}
      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition active:bg-gray-50 sm:px-5 sm:py-4 sm:hover:border-[#66806b]/40 sm:hover:bg-[#f8faf7]"
    >
      <p className="truncate font-medium text-[#1f2a24]">{data.project.name}</p>
      <p className="mt-1 truncate text-sm text-gray-500">{data.orchard.name}</p>
      <p className="mt-0.5 truncate text-sm text-gray-500">
        {data.project.projectLeader}
      </p>
    </button>
  );
}
