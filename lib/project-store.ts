import { Block, Grid, Layout, Orchard, Project, Treatment, UUID } from "@/types";

export interface ProjectData {
  project: Project;
  orchard: Orchard;
  blocks: Block[];
  layout: Layout;
  grids: Grid[];
  treatments?: Treatment[];
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