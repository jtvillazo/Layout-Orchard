"use client";

import { FormEvent, useState } from "react";

interface EditRowNumberModalProps {
  initialValue: number | null;
  onSave: (displayNumber: number | null) => void;
  onCancel: () => void;
}

export function EditRowNumberModal({
  initialValue,
  onSave,
  onCancel,
}: EditRowNumberModalProps) {
  const [value, setValue] = useState(
    initialValue !== null && initialValue !== undefined
      ? String(initialValue)
      : ""
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = value.trim();
    if (trimmed === "") {
      onSave(null);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return;
    }

    onSave(parsed);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl sm:p-5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
          Row Number
        </h2>

        <label className="mt-4 block">
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Leave empty to remove"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2f4034] focus:outline-none focus:ring-1 focus:ring-[#2f4034] sm:text-base"
            autoFocus
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#2f4034] px-3 py-2 text-sm font-medium text-white hover:bg-[#243329] sm:px-4"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
