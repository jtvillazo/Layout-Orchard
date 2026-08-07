"use client";

import { FormEvent, useState } from "react";

import type { Treatment, UUID } from "@/types";

interface TreatmentModalProps {
  layoutId: UUID;
  mode?: "create" | "edit";
  treatment?: Treatment;
  onSave: (treatment: Treatment) => void;
  onCancel: () => void;
  createId: () => UUID;
}

export function TreatmentModal({
  layoutId,
  mode = "create",
  treatment,
  onSave,
  onCancel,
  createId,
}: TreatmentModalProps) {
  const isEdit = mode === "edit" && treatment;

  const [name, setName] = useState(treatment?.name ?? "");
  const [labelName, setLabelName] = useState(treatment?.labelName ?? "");
  const [color, setColor] = useState(treatment?.color ?? "#22C55E");
  const [color2, setColor2] = useState(treatment?.color2 ?? "");
  const [comment, setComment] = useState(treatment?.comment ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedLabel = labelName.trim();
    if (!trimmedName || !trimmedLabel) return;

    const savedTreatment: Treatment = isEdit
      ? {
          ...treatment,
          name: trimmedName,
          labelName: trimmedLabel,
          color,
          ...(color2.trim() ? { color2: color2.trim() } : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        }
      : {
          id: createId(),
          layoutId,
          name: trimmedName,
          labelName: trimmedLabel,
          color,
          ...(color2.trim() ? { color2: color2.trim() } : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        };

    if (isEdit && !comment.trim()) {
      delete savedTreatment.comment;
    }

    if (isEdit && !color2.trim()) {
      delete savedTreatment.color2;
    }

    onSave(savedTreatment);
  }

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/30 p-5">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Treatment" : "New Treatment"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update this treatment for the layout."
              : "Create a treatment for this layout."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Label name
            </span>
            <input
              type="text"
              value={labelName}
              onChange={(event) => setLabelName(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base outline-none focus:border-[#66806b]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Color 1
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white"
              />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Color 2
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color2 || "#3B82F6"}
                onChange={(event) => setColor2(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white"
              />
              <span className="text-sm text-gray-500">
                {color2 || "Optional"}
              </span>
              {color2 && (
                <button
                  type="button"
                  onClick={() => setColor2("")}
                  className="text-sm font-medium text-gray-500 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </label>

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
  );
}
