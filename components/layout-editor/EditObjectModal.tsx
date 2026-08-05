"use client";

import { FormEvent, useState } from "react";

import type { MapObject, ObjectShape } from "@/types";

import {
  DEFAULT_OBJECT_COLOR,
  DEFAULT_OBJECT_SIZE,
  MAX_OBJECT_SIZE,
  MIN_OBJECT_SIZE,
  OBJECT_SHAPE_DEFINITIONS,
} from "@/lib/object-shapes";

export interface MapObjectFormFields {
  name: string;
  shape: ObjectShape;
  color: string;
  size: number;
  comment?: string;
}

interface EditObjectModalProps {
  mode: "create" | "edit";
  initialValues?: MapObject;
  onSave: (fields: MapObjectFormFields) => void;
  onCancel: () => void;
}

export function EditObjectModal({
  mode,
  initialValues,
  onSave,
  onCancel,
}: EditObjectModalProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [shape, setShape] = useState<ObjectShape>(
    initialValues?.shape ?? "circle"
  );
  const [comment, setComment] = useState(initialValues?.comment ?? "");
  const [color, setColor] = useState(initialValues?.color ?? DEFAULT_OBJECT_COLOR);
  const [size, setSize] = useState(initialValues?.size ?? DEFAULT_OBJECT_SIZE);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const trimmedComment = comment.trim();
    const clampedSize = Math.max(MIN_OBJECT_SIZE, Math.min(MAX_OBJECT_SIZE, size));

    onSave({
      name: trimmedName,
      shape,
      color,
      size: clampedSize,
      ...(trimmedComment ? { comment: trimmedComment } : {}),
    });
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create" ? "Add Object" : "Edit Object"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure the object placed on the layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
              placeholder="Sensor"
            />
          </label>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-700">
              Shape
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {OBJECT_SHAPE_DEFINITIONS.map((definition) => {
                const selected = shape === definition.shape;

                return (
                  <button
                    key={definition.shape}
                    type="button"
                    onClick={() => setShape(definition.shape)}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs ${
                      selected
                        ? "border-[#66806b] bg-[#f3f7f4] font-medium text-[#2f4034]"
                        : "border-gray-200 text-gray-700 active:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg leading-none">{definition.symbol}</span>
                    <span>{definition.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Color
            </span>
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Size
            </span>
            <input
              type="number"
              min={MIN_OBJECT_SIZE}
              max={MAX_OBJECT_SIZE}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
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
