import {
  Block,
  Grid,
  Layout,
  MapObject,
  MapText,
  Orchard,
  Project,
  Row,
  Treatment,
  UUID,
  Vine,
} from "@/types";

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

const STORAGE_KEY = "layout-orchard-projects";

function readProjects(): ProjectData[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  return JSON.parse(stored) as ProjectData[];
}

function saveProjects(projects: ProjectData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProjectData(data: ProjectData) {
  const projects = readProjects();

  projects.push(data);

  saveProjects(projects);

  return data;
}

export function getProjectData(projectId: UUID) {
  const projects = readProjects();

  return projects.find(
    (item) => item.project.id === projectId
  );
}

export function getLayoutData(layoutId: UUID) {
  const projects = readProjects();

  return projects.find(
    (item) => item.layout.id === layoutId
  );
}

export function getAllProjects() {
  return readProjects();
}

export function addGridToLayout(
  layoutId: UUID,
  grid: Grid
) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.grids.push(grid);

  saveProjects(projects);

  return projectData;
}

export function updateLayoutTreatments(
  layoutId: UUID,
  treatments: Treatment[]
) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.treatments = treatments;

  saveProjects(projects);

  return projectData;
}

export function updateLayoutVines(layoutId: UUID, vines: Vine[]) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.vines = vines;

  saveProjects(projects);

  return projectData;
}

export function updateLayoutMapObjects(layoutId: UUID, mapObjects: MapObject[]) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.mapObjects = mapObjects;

  saveProjects(projects);

  return projectData;
}

export function updateLayoutMapTexts(layoutId: UUID, mapTexts: MapText[]) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.mapTexts = mapTexts;

  saveProjects(projects);

  return projectData;
}

export function updateLayoutRows(layoutId: UUID, rows: Row[]) {
  const projects = readProjects();

  const projectData = projects.find(
    (item) => item.layout.id === layoutId
  );

  if (!projectData) {
    return null;
  }

  projectData.rows = rows;

  saveProjects(projects);

  return projectData;
}