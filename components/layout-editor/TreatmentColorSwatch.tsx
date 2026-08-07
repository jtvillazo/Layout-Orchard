import type { Treatment } from "@/types";

interface TreatmentColorSwatchProps {
  treatment: Treatment;
  className?: string;
}

export function TreatmentColorSwatch({
  treatment,
  className = "",
}: TreatmentColorSwatchProps) {
  if (treatment.color2) {
    return (
      <span
        className={`inline-flex h-3 w-3 shrink-0 overflow-hidden rounded-full border border-black/10 ${className}`}
        aria-hidden="true"
      >
        <span className="w-1/2" style={{ backgroundColor: treatment.color }} />
        <span className="w-1/2" style={{ backgroundColor: treatment.color2 }} />
      </span>
    );
  }

  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full border border-black/10 ${className}`}
      style={{ backgroundColor: treatment.color }}
      aria-hidden="true"
    />
  );
}
