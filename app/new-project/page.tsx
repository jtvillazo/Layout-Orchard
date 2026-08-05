"use client";

import { useRouter } from "next/navigation";
import { createProjectData } from "@/lib/project-store";
import { Block, Layout, Orchard, Project, UUID } from "@/types";
import { FormEvent, useRef, useState } from "react";

function createId(): UUID {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function NewProjectPage() {
 const router = useRouter();
 const currentUser = "current-user";
  const [projectName, setProjectName] = useState("");
  const [projectLeader, setProjectLeader] = useState("");
  const [variety, setVariety] = useState("");

  const [orchardName, setOrchardName] = useState("");
  const [orchardAddress, setOrchardAddress] = useState("");

  const [blocks, setBlocks] = useState([""]);
  const formRef = useRef<HTMLFormElement>(null);

  function addBlock() {
    setBlocks((current) => [...current, ""]);
  }

  function updateBlock(index: number, value: string) {
    setBlocks((current) =>
      current.map((block, blockIndex) =>
        blockIndex === index ? value : block
      )
    );
  }

  function removeBlock(index: number) {
    setBlocks((current) =>
      current.filter((_, blockIndex) => blockIndex !== index)
    );
  }

  function createProject() {
    const orchardId = createId();
    const projectId = createId();
    const layoutId = createId();

    const blockObjects: Block[] = blocks
      .filter((block) => block.trim() !== "")
      .map((block) => ({
        id: createId(),
        orchardId,
        name: block.trim(),
      }));

    const orchard: Orchard = {
      id: orchardId,
      name: orchardName.trim(),
      address: orchardAddress.trim() || undefined,
    };

    const project: Project = {
      id: projectId,
      name: projectName.trim(),
      variety: variety.trim(),
      projectLeader: projectLeader.trim(),
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

    createProjectData({
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!event.currentTarget.reportValidity()) {
      return;
    }

    createProject();
  }

  function handleCreateClick() {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    createProject();
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] text-[#1f2a24]">
      <div className="mx-auto w-full max-w-xl px-5 pb-10">
        {/* Header */}
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
            <h1 className="text-lg font-semibold">New Project</h1>
            <p className="text-sm text-gray-500">
              Create a project and its first layout
            </p>
          </div>
        </header>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Project */}
          <section>
            <SectionTitle>Project</SectionTitle>

            <div className="space-y-4">
              <Field
                label="Project name"
                value={projectName}
                onChange={setProjectName}
                placeholder="e.g. Fertilizer Trial 2026"
                required
              />

              <Field
                label="Project leader"
                value={projectLeader}
                onChange={setProjectLeader}
                placeholder="e.g. Ana Rodríguez"
                required
              />

              <Field
                label="Variety"
                value={variety}
                onChange={setVariety}
                placeholder="e.g. Hayward"
                required
              />
            </div>
          </section>

          {/* Orchard */}
          <section>
            <SectionTitle>Orchard</SectionTitle>

            <div className="space-y-4">
              <Field
                label="Orchard name"
                value={orchardName}
                onChange={setOrchardName}
                placeholder="e.g. Te Puke Orchard"
                required
              />

              <Field
                label="Address"
                value={orchardAddress}
                onChange={setOrchardAddress}
                placeholder="Orchard address"
              />

            
            </div>
          </section>

          {/* Blocks */}
          <section>
            <SectionTitle>Blocks</SectionTitle>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={block}
                    onChange={(event) =>
                      updateBlock(index, event.target.value)
                    }
                    placeholder={`Block ${index + 1}`}
                    required
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
                  />

                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500"
                      aria-label={`Remove block ${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addBlock}
                className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#66806b]"
              >
                + Add another block
              </button>
            </div>
          </section>

          {/* Submit */}
          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full rounded-xl bg-[#2f4034] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#243329]"
          >
            Create Project
          </button>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#66806b]">
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
      />
    </label>
  );
}