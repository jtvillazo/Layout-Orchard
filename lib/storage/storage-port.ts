import type { ProjectData } from "@/lib/storage/project-data";
import type { Grid, MapObject, MapText, Row, Treatment, UUID, Vine } from "@/types";

/** Application-facing persistence API. UI should depend on this contract, not IndexedDB. */
export interface LayoutStorage {
  createProjectData(data: ProjectData): Promise<ProjectData>;
  getProjectData(projectId: UUID): Promise<ProjectData | null>;
  getLayoutData(layoutId: UUID): Promise<ProjectData | null>;
  getAllProjects(): Promise<ProjectData[]>;
  addGridToLayout(
    layoutId: UUID,
    grid: Grid,
    rows?: Row[]
  ): Promise<ProjectData | null>;
  updateLayoutTreatments(
    layoutId: UUID,
    treatments: Treatment[]
  ): Promise<ProjectData | null>;
  updateLayoutVines(layoutId: UUID, vines: Vine[]): Promise<ProjectData | null>;
  updateLayoutMapObjects(
    layoutId: UUID,
    mapObjects: MapObject[]
  ): Promise<ProjectData | null>;
  updateLayoutMapTexts(
    layoutId: UUID,
    mapTexts: MapText[]
  ): Promise<ProjectData | null>;
  updateLayoutRows(layoutId: UUID, rows: Row[]): Promise<ProjectData | null>;
}
