"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { LayoutForm, type LayoutFormValues } from "@/components/layout/LayoutForm";
import { createId } from "@/lib/create-id";
import { createProjectData } from "@/lib/project-store";
import { Block, Layout, Orchard, Project } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();
  const currentUser = "current-user";
  const formRef = useRef<HTMLFormElement>(null);

  async function createProject(values: LayoutFormValues) {
    const orchardId = createId();
    const projectId = createId();
    const layoutId = createId();

    const blockObjects: Block[] = values.blocks
      .filter((block) => block.name.trim() !== "")
      .map((block) => ({
        id: createId(),
        orchardId,
        name: block.name.trim(),
      }));

    const orchard: Orchard = {
      id: orchardId,
      name: values.orchardName.trim(),
      address: values.orchardAddress.trim() || undefined,
    };

    const project: Project = {
      id: projectId,
      name: values.projectName.trim(),
      variety: values.variety.trim(),
      projectLeader: values.projectLeader.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    };

    const layout: Layout = {
      id: layoutId,
      projectId,
      orchardId,
      blockIds: blockObjects.map((block) => block.id),
      status: "draft",
      lastEditedBy: currentUser,
      lastEditedAt: new Date().toISOString(),
    };

    await createProjectData({
      project,
      orchard,
      blocks: blockObjects,
      layout,
      grids: [],
      treatments: [],
      vines: [],
      mapObjects: [],
      mapTexts: [],
      rows: [],
    });

    router.push(`/test-grid?layoutId=${layoutId}`);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#1f2a24]">
      <div className="mx-auto w-full max-w-xl px-5 pb-10">
        <header className="flex items-center gap-4 py-5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm"
            aria-label="Go back"
          >
            ←
          </button>

          <div>
            <h1 className="text-lg font-semibold">New Layout</h1>
            <p className="text-sm text-gray-500">Create a new layout</p>
          </div>
        </header>

        <LayoutForm
          formRef={formRef}
          submitLabel="Create Layout"
          onSubmit={createProject}
        />
      </div>
    </main>
  );
}
