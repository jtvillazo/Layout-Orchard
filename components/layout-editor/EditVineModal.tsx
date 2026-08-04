"use client";

import { FormEvent, useState, type ReactNode } from "react";

import type { Treatment, UUID, Vine } from "@/types";

import { TreatmentModal } from "./TreatmentModal";

export interface VineEditableFields {
  gender: "male" | "female";
  treatmentId: UUID | null;
  comment?: string;
}

interface EditVineModalProps {
  vine: Vine;
  layoutId: UUID;
  treatments: Treatment[];
  onSave: (updates: VineEditableFields) => void;
  onCancel: () => void;
  onAddTreatment: (treatment: Treatment) => void;
  createId: () => UUID;
}

function GenderOption({
  label,
  selected,
  onSelect,
  preview,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  preview: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
        selected
          ? "border-[#66806b] bg-[#f3f7f4]"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {preview}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

export function EditVineModal({
  vine,
  layoutId,
  treatments,
  onSave,
  onCancel,
  onAddTreatment,
  createId,
}: EditVineModalProps) {
  const [gender, setGender] = useState<Vine["gender"]>(vine.gender);
  const [treatmentId, setTreatmentId] = useState(vine.treatmentId ?? "");
  
  const [comment, setComment] = useState(vine.comment ?? "");
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedComment = comment.trim();

    onSave({
      gender,
      treatmentId: treatmentId || null,
      ...(trimmedComment ? { comment: trimmedComment } : {}),
    });
  }

  function handleTreatmentCreated(treatment: Treatment) {
    onAddTreatment(treatment);
    setTreatmentId(treatment.id);
    setShowTreatmentModal(false);
  }

  return (
    <>
      <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/30 p-5">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Edit Vine</h2>
            <p className="mt-1 text-sm text-gray-500">
              Row {vine.rowNumber}, Bay {vine.bayIndex}, Slot {vine.slot}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-gray-700">
                Gender
              </legend>
              <div className="flex gap-3">
                <GenderOption
                  label="Female"
                  selected={gender === "female"}
                  onSelect={() => setGender("female")}
                  preview={
                    <svg width="24" height="24" aria-hidden="true">
                      <circle cx="12" cy="12" r="8" fill="#D1D5DB" stroke="#111827" />
                    </svg>
                  }
                />
                <GenderOption
                  label="Male"
                  selected={gender === "male"}
                  onSelect={() => setGender("male")}
                  preview={
                    <svg width="24" height="24" aria-hidden="true">
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        fill="#D1D5DB"
                        stroke="#111827"
                      />
                    </svg>
                  }
                />
              </div>
            </fieldset>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Treatment
              </span>
              <div className="flex gap-2">
                <select
                  value={treatmentId}
                  onChange={(event) => setTreatmentId(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
                >
                  <option value="">Untreated</option>
                  {treatments.map((treatment) => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowTreatmentModal(true)}
                  className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-[#2f4034] hover:border-[#66806b]"
                >
                  + Add new
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Comment
              </span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
              />
            </label>

          

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#2f4034] px-4 py-3 text-sm font-medium text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {showTreatmentModal && (
        <TreatmentModal
          layoutId={layoutId}
          mode="create"
          createId={createId}
          onCancel={() => setShowTreatmentModal(false)}
          onSave={handleTreatmentCreated}
        />
      )}
    </>
  );
}
