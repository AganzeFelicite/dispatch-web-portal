export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export interface GeoFeature {
  name: string;
  lng: number;
  lat: number;
}

/** Forward geocode via the Mapbox Search (v6) API. Returns [] when no token or on failure. */
export async function geocode(query: string): Promise<GeoFeature[]> {
  if (!MAPBOX_TOKEN || !query.trim()) return [];
  const url =
    `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}` +
    `&limit=5&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const body = await res.json();
  return (body.features ?? []).map((f: {
    properties?: { full_address?: string; name?: string };
    geometry: { coordinates: [number, number] };
  }) => ({
    name: f.properties?.full_address ?? f.properties?.name ?? "",
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}

/** Reverse geocode a point to a human label. Falls back to the coordinates. */
export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  if (!MAPBOX_TOKEN) return fallback;
  const url =
    `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}` +
    `&limit=1&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return fallback;
  const body = await res.json();
  return body.features?.[0]?.properties?.full_address ?? fallback;
}
