import type { Vine } from "@/types";

const ALL_SLOTS = [1, 2, 3] as const;

/**
 * Devuelve el primer slot libre (1, 2 o 3) en un bay, o null si los tres
 * están ocupados. No asume que los slots existentes sean consecutivos.
 */
export function getFirstAvailableSlot(existingVinesInBay: Vine[]): 1 | 2 | 3 | null {
  const usedSlots = new Set(existingVinesInBay.map((vine) => vine.slot));
  for (const slot of ALL_SLOTS) {
    if (!usedSlots.has(slot)) return slot;
  }
  return null;
}

/**
 * Determina cómo deben reacomodarse los slots de las vines YA EXISTENTES
 * en un bay, cuando se agrega una vine nueva en una posición relativa
 * elegida por el usuario (sección 4: "el usuario puede elegir su posición:
 * al comienzo, al medio, o al final").
 *
 * Esto NO asigna el slot de la vine nueva — eso lo decide el llamador
 * según cuántas vines había antes (ver la lógica al final de este archivo).
 * Esta función solo dice qué vines existentes hay que actualizar y a
 * qué slot nuevo, para no romper el orden relativo elegido por el usuario.
 *
 * Devuelve un mapa: vineId → nuevo slot que le corresponde.
 * Si el mapa no incluye una vine, significa que su slot no cambia.
 */
export function computeSlotAssignment(
  existingVinesInBay: Vine[],
  newVinePosition: "start" | "middle" | "end"
): Map<string, 1 | 2 | 3> {
  // Ordenamos las existentes por su slot actual, para conocer
  // su orden relativo real (no solo el número que tenían asignado).
  const sortedExisting = [...existingVinesInBay].sort((a, b) => a.slot - b.slot);

  const result = new Map<string, 1 | 2 | 3>();

  if (sortedExisting.length === 0) {
    // Bay vacío: no hay nada que reacomodar.
    // La nueva vine será slot 1 (lo decide el llamador).
    return result;
  }

  if (sortedExisting.length === 1) {
    // Ya hay 1 vine: la nueva puede ir antes o después de ella.
    if (newVinePosition === "start") {
      result.set(sortedExisting[0].id, 2); // la existente pasa a slot 2
      // la nueva vine será slot 1
    } else {
      result.set(sortedExisting[0].id, 1); // la existente queda/pasa a slot 1
      // la nueva vine será slot 2
      // nota: "middle" con solo 1 existente se trata igual que "end",
      // ya que no hay un verdadero "medio" posible todavía.
    }
    return result;
  }

  // Ya hay 2 vines (el caso más común antes de llegar al máximo de 3,
  // sección 4: "hasta 3 vines por bay"): la nueva entra en la posición
  // elegida y las demás se reacomodan para dejarle el lugar.
  const [first, second] = sortedExisting;

  if (newVinePosition === "start") {
    result.set(first.id, 2);
    result.set(second.id, 3);
    // la nueva vine será slot 1
  } else if (newVinePosition === "middle") {
    result.set(first.id, 1);
    result.set(second.id, 3);
    // la nueva vine será slot 2
  } else {
    result.set(first.id, 1);
    result.set(second.id, 2);
    // la nueva vine será slot 3
  }

  return result;
}

/**
 * Determina el slot que le corresponde a la VINE NUEVA, en base a
 * cuántas vines ya existían en el bay y la posición relativa elegida.
 * Se usa junto con computeSlotAssignment(), que resuelve el resto.
 *
 * Devuelve null si el bay ya tiene 3 vines (el máximo permitido,
 * sección 4) — el llamador debe bloquear la creación en ese caso.
 */
export function computeNewVineSlot(
  existingVinesInBay: Vine[],
  newVinePosition: "start" | "middle" | "end"
): 1 | 2 | 3 | null {
  const total = existingVinesInBay.length;

  if (total >= 3) return null; // bay lleno, no se puede agregar más

  if (total === 0) return 1;

  if (total === 1) {
    return newVinePosition === "start" ? 1 : 2;
  }

  // total === 2
  if (newVinePosition === "start") return 1;
  if (newVinePosition === "middle") return 2;
  return 3; // "end"
}