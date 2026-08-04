import type { Treatment, UUID, Vine } from "@/types";

export function getLayoutTreatments(
  treatments: Treatment[],
  layoutId: UUID
): Treatment[] {
  return treatments.filter((treatment) => treatment.layoutId === layoutId);
}

export function countVinesByTreatmentId(vines: Vine[]): Record<UUID, number> {
  const counts: Record<UUID, number> = {};
  vines.forEach((vine) => {
    if (!vine.treatmentId) return;
    counts[vine.treatmentId] = (counts[vine.treatmentId] ?? 0) + 1;
  });
  return counts;
}

export function countVinesForTreatment(vines: Vine[], treatmentId: UUID): number {
  return vines.filter((vine) => vine.treatmentId === treatmentId).length;
}
