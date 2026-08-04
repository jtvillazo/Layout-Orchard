"use client";

import { FormEvent, useState } from "react";

import type { MapObject, PredefinedObjectIcon } from "@/types";

import { OBJECT_TYPE_DEFINITIONS } from "@/lib/object-types";

export interface MapObjectEditableFields {
  name: string;
  icon: PredefinedObjectIcon;
  scale: number;
  color: string;
}

interface EditObjectModalProps {
  object: MapObject;
  onSave: (updates: MapObjectEditableFields) => void;
  onCancel: () => void;
}

export function EditObjectModal({
  object,
  onSave,
  onCancel,
}: EditObjectModalProps) {
  const [name, setName] = useState(object.text ?? "");
  const [icon, setIcon] = useState<PredefinedObjectIcon>(object.icon ?? "sensor");
  const [scale, setScale] = useState(object.scale || 1);
  const [color, setColor] = useState(object.color ?? "#66806b");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      name: name.trim(),
      icon,
      scale,
      color,
    });
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Edit Object</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the object label and appearance.
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
              placeholder="Object name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Type
            </span>
            <select
              value={icon}
              onChange={(event) =>
                setIcon(event.target.value as PredefinedObjectIcon)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-[#66806b] focus:ring-2 focus:ring-[#66806b]/10"
            >
              {OBJECT_TYPE_DEFINITIONS.map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {definition.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Size ({scale.toFixed(1)}x)
            </span>
            <input
              type="range"
              min={0.6}
              max={2}
              step={0.1}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="w-full"
            />
          </label>

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
