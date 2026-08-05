export const DB_NAME = "layout-orchard";
export const DB_VERSION = 1;

export const STORES = {
  projects: "projects",
  orchards: "orchards",
  blocks: "blocks",
  layouts: "layouts",
  grids: "grids",
  vines: "vines",
  treatments: "treatments",
  mapObjects: "mapObjects",
  mapTexts: "mapTexts",
  rows: "rows",
  meta: "meta",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];
