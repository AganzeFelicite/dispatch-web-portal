"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "./api";
import type { VehicleType } from "./types";

/**
 * Vehicle types are rows in the database, not a compiled-in list, so every dropdown and label has
 * to read them from the API.
 *
 * Labels are needed in places that are not worth threading a hook through — a table cell deep in a
 * dashboard, say — so the fetch fills a module-level map that [tierLabel] reads. It is populated in
 * the query function rather than during render, so rendering stays pure. Before the first fetch
 * lands, [tierLabel] falls back to prettifying the code, which reads correctly anyway
 * ("MINI_TRUCK" → "Mini truck").
 */
const labels: Record<string, { label: string; capacity: string }> = {};

async function fetchVehicleTypes(includeInactive: boolean): Promise<VehicleType[]> {
  const types = await api.get<VehicleType[]>(
    `/vehicle-types${includeInactive ? "?includeInactive=true" : ""}`,
  );
  for (const t of types) labels[t.code] = { label: t.label, capacity: t.capacity };
  return types;
}

/** The bookable types, in the display order ops set. */
export function useVehicleTypes(includeInactive = false) {
  return useQuery({
    queryKey: ["vehicle-types", includeInactive],
    queryFn: () => fetchVehicleTypes(includeInactive),
    staleTime: 5 * 60 * 1000,
  });
}

/** "Pickup · up to 800 kg" — the same wording the customer sees in the app. */
export function tierLabel(tier: string, withCapacity = false): string {
  const m = labels[tier];
  if (!m) return prettify(tier);
  return withCapacity ? `${m.label} · ${m.capacity}` : m.label;
}

function prettify(code: string): string {
  const words = code.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
