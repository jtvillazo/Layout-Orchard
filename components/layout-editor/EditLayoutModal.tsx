"use client";

import type { ProjectData } from "@/lib/storage/project-data";
import type { Block, UUID } from "@/types";

import {
  LayoutForm,
  type LayoutFormValues,
} from "@/components/layout/LayoutForm";

interface EditLayoutModalProps {
  projectData: ProjectData;
  protectedBlockIds: Set<UUID>;
  onCancel: () => void;
  onSave: (values: LayoutFormValues) => void | Promise<void>;
}

export function projectDataToFormValues(data: ProjectData): LayoutFormValues {
  return {
    projectName: data.project.name,
    projectLeader: data.project.projectLeader,
    variety: data.project.variety,
    orchardName: data.orchard.name,
    orchardAddress: data.orchard.address ?? "",
    blocks: data.blocks.map((block) => ({
      id: block.id,
      name: block.name,
    })),
  };
}

export function formValuesToMetadataUpdate(
  data: ProjectData,
  values: LayoutFormValues,
  createId: () => UUID
): {
  project: ProjectData["project"];
  orchard: ProjectData["orchard"];
  blocks: Block[];
} {
  const blocks: Block[] = values.blocks
    .filter((block) => block.name.trim() !== "")
    .map((block) => ({
      id: block.id ?? createId(),
      orchardId: data.orchard.id,
      name: block.name.trim(),
    }));

  const project = {
    ...data.project,
    name: values.projectName.trim(),
    projectLeader: values.projectLeader.trim(),
    variety: values.variety.trim(),
  };

  const orchard = {
    ...data.orchard,
    name: values.orchardName.trim(),
    ...(values.orchardAddress.trim()
      ? { address: values.orchardAddress.trim() }
      : { address: undefined }),
  };

  return { project, orchard, blocks };
}

export function EditLayoutModal({
  projectData,
  protectedBlockIds,
  onCancel,
  onSave,
}: EditLayoutModalProps) {
  return (
    <div className="absolute inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/30 p-5">
      <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Edit Layout</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update project, orchard, and block information.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <LayoutForm
          initialValues={projectDataToFormValues(projectData)}
          submitLabel="Save changes"
          protectedBlockIds={protectedBlockIds}
          onSubmit={onSave}
        />
      </div>
    </div>
  );
}
