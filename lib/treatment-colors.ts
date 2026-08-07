import type { Treatment } from "@/types";

export function treatmentUsesTwoColors(treatment: Treatment): boolean {
  return Boolean(treatment.color2);
}

export function getTreatmentVineColors(treatment: Treatment | null | undefined): {
  primary: string;
  secondary: string | null;
} {
  if (!treatment) {
    return { primary: "#D1D5DB", secondary: null };
  }

  if (treatment.color2) {
    return { primary: treatment.color, secondary: treatment.color2 };
  }

  return { primary: treatment.color, secondary: null };
}
