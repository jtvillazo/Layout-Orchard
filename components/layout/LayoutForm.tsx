"use client";

import { FormEvent, useRef, useState, type RefObject } from "react";

import type { UUID } from "@/types";

export type LayoutFormBlock = {
  id?: UUID;
  name: string;
};

export type LayoutFormValues = {
  projectName: string;
  projectLeader: string;
  variety: string;
  orchardName: string;
  orchardAddress: string;
  blocks: LayoutFormBlock[];
};

interface LayoutFormProps {
  initialValues?: LayoutFormValues;
  submitLabel: string;
  onSubmit: (values: LayoutFormValues) => void | Promise<void>;
  protectedBlockIds?: Set<UUID>;
  formRef?: RefObject<HTMLFormElement | null>;
}

const EMPTY_VALUES: LayoutFormValues = {
  projectName: "",
  projectLeader: "",
  variety: "",
  orchardName: "",
  orchardAddress: "",
  blocks: [{ name: "" }],
};

export function LayoutForm({
  initialValues,
  submitLabel,
  onSubmit,
  protectedBlockIds,
  formRef: externalFormRef,
}: LayoutFormProps) {
  const internalFormRef = useRef<HTMLFormElement>(null);
  const formRef = externalFormRef ?? internalFormRef;

  const [projectName, setProjectName] = useState(
    initialValues?.projectName ?? EMPTY_VALUES.projectName
  );
  const [projectLeader, setProjectLeader] = useState(
    initialValues?.projectLeader ?? EMPTY_VALUES.projectLeader
  );
  const [variety, setVariety] = useState(
    initialValues?.variety ?? EMPTY_VALUES.variety
  );
  const [orchardName, setOrchardName] = useState(
    initialValues?.orchardName ?? EMPTY_VALUES.orchardName
  );
  const [orchardAddress, setOrchardAddress] = useState(
    initialValues?.orchardAddress ?? EMPTY_VALUES.orchardAddress
  );
  const [blocks, setBlocks] = useState<LayoutFormBlock[]>(
    initialValues?.blocks.length ? initialValues.blocks : EMPTY_VALUES.blocks
  );
  const [blockError, setBlockError] = useState<string | null>(null);

  function addBlock() {
    setBlocks((current) => [...current, { name: "" }]);
  }

  function updateBlock(index: number, value: string) {
    setBlocks((current) =>
      current.map((block, blockIndex) =>
        blockIndex === index ? { ...block, name: value } : block
      )
    );
  }

  function removeBlock(index: number) {
    const block = blocks[index];
    if (block.id && protectedBlockIds?.has(block.id)) {
      setBlockError("Blocks with grids cannot be removed.");
      return;
    }

    setBlockError(null);
    setBlocks((current) =>
      current.filter((_, blockIndex) => blockIndex !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!event.currentTarget.reportValidity()) {
      return;
    }

    setBlockError(null);
    await onSubmit({
      projectName,
      projectLeader,
      variety,
      orchardName,
      orchardAddress,
      blocks,
    });
  }

  async function handleSubmitClick() {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    setBlockError(null);
    await onSubmit({
      projectName,
      projectLeader,
      variety,
      orchardName,
      orchardAddress,
      blocks,
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
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

      <section>
        <SectionTitle>Blocks</SectionTitle>

        <div className="space-y-3">
          {blocks.map((block, index) => {
            const isProtected = Boolean(
              block.id && protectedBlockIds?.has(block.id)
            );

            return (
              <div key={block.id ?? `new-block-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={block.name}
                  onChange={(event) => updateBlock(index, event.target.value)}
                  placeholder={`Block ${index + 1}`}
                  required
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
                />

                {blocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    disabled={isProtected}
                    title={
                      isProtected
                        ? "This block has grids and cannot be removed"
                        : `Remove block ${index + 1}`
                    }
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove block ${index + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {blockError && (
            <p className="text-sm text-red-600">{blockError}</p>
          )}

          <button
            type="button"
            onClick={addBlock}
            className="w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-[#66806b]"
          >
            + Add another block
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmitClick}
        className="w-full rounded-xl bg-[#2f4034] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#243329]"
      >
        {submitLabel}
      </button>
    </form>
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
