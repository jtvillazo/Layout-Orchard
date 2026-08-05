"use client";

import { FormEvent, useState } from "react";

export interface MapTextFormFields {
  text: string;
  fontSize: number;
  comment?: string;
}

interface EditTextModalProps {
  mode: "create" | "edit";
  initialValues?: MapTextFormFields;
  onSave: (fields: MapTextFormFields) => void;
  onCancel: () => void;
}

export function EditTextModal({
  mode,
  initialValues,
  onSave,
  onCancel,
}: EditTextModalProps) {
  const [text, setText] = useState(initialValues?.text ?? "");
  const [fontSize, setFontSize] = useState(initialValues?.fontSize ?? 16);
  const [comment, setComment] = useState(initialValues?.comment ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const size = Math.max(8, Math.min(120, fontSize));
    const trimmedComment = comment.trim();

    onSave({
      text: trimmedText,
      fontSize: size,
      ...(trimmedComment ? { comment: trimmedComment } : {}),
    });
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create" ? "Add Text" : "Edit Text"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the label to display on the layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Text
            </span>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
              placeholder="Pump House"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Font size
            </span>
            <input
              type="number"
              min={8}
              max={120}
              value={fontSize}
              onChange={(event) => setFontSize(Number(event.target.value))}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Comment
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
              placeholder="Optional notes"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-11 flex-1 rounded-xl bg-[#2f4034] px-4 py-2.5 text-sm font-medium text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
