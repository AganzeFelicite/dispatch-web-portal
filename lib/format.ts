/** Whole-RWF money formatting for display. */
export function money(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString()} RWF`;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").toLowerCase();
}

// Vehicle-type labels come from the API; re-exported here so the many call sites that already
// import { tierLabel } from "@/lib/format" keep working.
export { tierLabel } from "./vehicleTypes";
