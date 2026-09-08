/**
 * Exact-place search for the booking form, the same as the mobile app (`mobile/lib/core/geo.dart`):
 * Google Places autocomplete when NEXT_PUBLIC_GOOGLE_PLACES_KEY is set (shops, buildings, gates),
 * otherwise komoot's free Photon (OpenStreetMap), both biased to Kigali and limited to Rwanda.
 */
export interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Google suggestion whose coordinates are fetched on selection (see [resolvePlace]). */
  placeId?: string;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY ?? "";
const KIGALI = { latitude: -1.9441, longitude: 30.0619 };
const RWANDA_BBOX = "28.85,-2.85,30.9,-1.05";

/** One line for the booking: "Simba Supermarket, KG 541 St, Kimihurura". */
export function placeText(p: Place): string {
  return !p.address || p.address === p.name ? p.name : `${p.name}, ${p.address}`;
}

export async function searchPlaces(query: string, session?: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    return GOOGLE_KEY ? await google(q, session) : await photon(q);
  } catch {
    return [];
  }
}

/** Fills coordinates for a Google suggestion; other places come back unchanged. */
export async function resolvePlace(p: Place, session?: string): Promise<Place> {
  if (!p.placeId || p.lat !== 0 || p.lng !== 0) return p;
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${p.placeId}${session ? `?sessionToken=${session}` : ""}`,
    { headers: { "X-Goog-Api-Key": GOOGLE_KEY, "X-Goog-FieldMask": "location,displayName,formattedAddress" } },
  );
  if (!res.ok) throw new Error(`Places details ${res.status}`);
  const d = await res.json();
  return {
    name: d.displayName?.text ?? p.name,
    address: d.formattedAddress ?? p.address,
    lat: d.location.latitude,
    lng: d.location.longitude,
  };
}

async function google(q: string, session?: string): Promise<Place[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_KEY },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ["rw"],
      locationBias: { circle: { center: KIGALI, radius: 30000 } },
      ...(session ? { sessionToken: session } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Places autocomplete ${res.status}`);
  const body = await res.json();
  type Suggestion = {
    placePrediction?: {
      placeId: string;
      text: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  };
  return ((body.suggestions ?? []) as Suggestion[])
    .filter((s) => s.placePrediction)
    .map((s) => ({
      name: s.placePrediction!.structuredFormat?.mainText?.text ?? s.placePrediction!.text.text,
      address: s.placePrediction!.structuredFormat?.secondaryText?.text ?? "",
      lat: 0,
      lng: 0,
      placeId: s.placePrediction!.placeId,
    }));
}

/** Photon ANDs every word, so a "name area" query that misses is retried with the first word. */
async function photon(q: string): Promise<Place[]> {
  const run = async (text: string): Promise<Place[]> => {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&lat=${KIGALI.latitude}` +
      `&lon=${KIGALI.longitude}&limit=10&bbox=${RWANDA_BBOX}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const body = await res.json();
    type Feature = { properties: Record<string, string | undefined>; geometry: { coordinates: [number, number] } };
    return ((body.features ?? []) as Feature[]).map((f) => {
      const parts: string[] = [];
      for (const k of ["street", "district", "city"]) {
        const v = f.properties[k];
        if (v && !parts.includes(v)) parts.push(v);
      }
      const name = f.properties.name ?? parts[0] ?? "Unnamed place";
      return {
        name,
        address: parts.filter((x) => x !== name).join(", "),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
  };
  const r = await run(q);
  const words = q.split(/\s+/);
  return r.length === 0 && words.length > 1 ? run(words[0]) : r;
}
