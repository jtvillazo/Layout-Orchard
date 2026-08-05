import type {
  Block,
  Grid,
  Layout,
  MapObject,
  MapText,
  Orchard,
  Project,
  Row,
  Treatment,
  Vine,
} from "@/types";

/** Aggregated project document used by the layout editor (read model). */
export interface ProjectData {
  project: Project;
  orchard: Orchard;
  blocks: Block[];
  layout: Layout;
  grids: Grid[];
  treatments?: Treatment[];
  vines?: Vine[];
  mapObjects?: MapObject[];
  mapTexts?: MapText[];
  rows?: Row[];
}
