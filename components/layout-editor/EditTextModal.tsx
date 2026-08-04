"use client";

import { FormEvent, useState } from "react";

interface EditTextModalProps {
  mode: "create" | "edit";
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function EditTextModal({
  mode,
  initialContent = "",
  onSave,
  onCancel,
}: EditTextModalProps) {
  const [content, setContent] = useState(initialContent);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    onSave(trimmed);
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
              value={content}
              onChange={(event) => setContent(event.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
              placeholder="Pump House"
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
