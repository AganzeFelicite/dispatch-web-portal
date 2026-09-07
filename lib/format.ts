import { TIER_META, type VehicleTier } from "./types";

/** Whole-RWF money formatting for display. */
export function money(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString()} RWF`;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").toLowerCase();
}

/** "Pickup · up to 800 kg" — the same wording the customer sees in the app. */
export function tierLabel(tier: VehicleTier, withCapacity = false): string {
  const m = TIER_META[tier];
  return withCapacity ? `${m.label} · ${m.capacity}` : m.label;
}
