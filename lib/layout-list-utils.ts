import type { ProjectData } from "@/lib/storage/project-data";
import type { UUID } from "@/types";

export interface LayoutSummary {
  layoutId: UUID;
  projectName: string;
  orchardName: string;
  leader: string;
  lastEditedAt: string;
}

export function toLayoutSummary(data: ProjectData): LayoutSummary {
  return {
    layoutId: data.layout.id,
    projectName: data.project.name,
    orchardName: data.orchard.name,
    leader: data.project.projectLeader,
    lastEditedAt: data.layout.lastEditedAt,
  };
}

export function compareByLastEditedDesc(a: ProjectData, b: ProjectData): number {
  const timeA = Date.parse(a.layout.lastEditedAt) || 0;
  const timeB = Date.parse(b.layout.lastEditedAt) || 0;
  return timeB - timeA;
}

export function sortLayoutsByLastEdited(
  projects: ProjectData[]
): ProjectData[] {
  return [...projects].sort(compareByLastEditedDesc);
}

export function getRecentLayouts(
  projects: ProjectData[],
  limit = 5
): ProjectData[] {
  return sortLayoutsByLastEdited(projects).slice(0, limit);
}

export function getLayoutEditorPath(layoutId: UUID): string {
  return `/test-grid?layoutId=${encodeURIComponent(layoutId)}`;
}
