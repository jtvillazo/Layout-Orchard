import type { UUID } from "@/types";

export function createId(): UUID {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
