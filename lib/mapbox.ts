export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export interface GeoFeature {
  name: string;
  lng: number;
  lat: number;
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
