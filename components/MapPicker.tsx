"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MbMap, Marker } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { MAPBOX_TOKEN, geocode, reverseGeocode, type GeoFeature } from "@/lib/mapbox";

export interface LatLngText {
  text: string;
  lat: number;
  lng: number;
}

interface Props {
  pickup: LatLngText | null;
  dropoff: LatLngText | null;
  onChange?: (next: { pickup: LatLngText | null; dropoff: LatLngText | null }) => void;
  readOnly?: boolean;
  height?: number;
}

const KIGALI: [number, number] = [30.0619, -1.9441];

export default function MapPicker({ pickup, dropoff, onChange, readOnly, height = 340 }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MbMap | null>(null);
  const pickupMarker = useRef<Marker | null>(null);
  const dropoffMarker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"pickup" | "dropoff">("pickup");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeoFeature[]>([]);

  // Keep the latest handler/state for the (once-bound) click listener.
  const state = useRef({ pickup, dropoff, mode, onChange, readOnly });
  state.current = { pickup, dropoff, mode, onChange, readOnly };

  useEffect(() => {
    if (!MAPBOX_TOKEN || !container.current) return;
    let disposed = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      if (disposed || !container.current) return;
      const m = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: KIGALI,
        zoom: 11,
      });
      map.current = m;
      m.on("load", () => {
        m.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
        m.addLayer({
          id: "route",
          type: "line",
          source: "route",
          paint: { "line-color": "#1e46a8", "line-width": 3 },
        });
        setReady(true);
      });

      if (!readOnly) {
        m.on("click", async (e) => {
          const { lng, lat } = e.lngLat;
          const which = state.current.mode;
          const text = await reverseGeocode(lng, lat);
          const point: LatLngText = { text, lat, lng };
          const next = {
            pickup: which === "pickup" ? point : state.current.pickup,
            dropoff: which === "dropoff" ? point : state.current.dropoff,
          };
          state.current.onChange?.(next);
          if (which === "pickup") setMode("dropoff");
        });
      }
    })();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect prop changes onto the markers + connecting line.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    let mounted = true;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (!mounted) return;
      const place = (
        ref: React.MutableRefObject<Marker | null>,
        p: LatLngText | null,
        color: string,
      ) => {
        if (p) {
          if (ref.current) ref.current.setLngLat([p.lng, p.lat]);
          else ref.current = new mapboxgl.Marker({ color }).setLngLat([p.lng, p.lat]).addTo(m);
        } else if (ref.current) {
          ref.current.remove();
          ref.current = null;
        }
      };
      place(pickupMarker, pickup, "#1e46a8");
      place(dropoffMarker, dropoff, "#f5a623");

      const coords = [pickup, dropoff].filter(Boolean).map((p) => [p!.lng, p!.lat]);
      const src = m.getSource("route") as { setData?: (d: unknown) => void } | undefined;
      src?.setData?.({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });
      if (coords.length === 2) {
        m.fitBounds([coords[0] as [number, number], coords[1] as [number, number]], {
          padding: 60,
          maxZoom: 14,
        });
      } else if (coords.length === 1) {
        m.easeTo({ center: coords[0] as [number, number], zoom: 13 });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pickup, dropoff, ready]);

  async function runSearch() {
    setResults(await geocode(search));
  }

  function choose(f: GeoFeature) {
    const point: LatLngText = { text: f.name, lat: f.lat, lng: f.lng };
    const next = {
      pickup: mode === "pickup" ? point : pickup,
      dropoff: mode === "dropoff" ? point : dropoff,
    };
    onChange?.(next);
    setResults([]);
    setSearch("");
    if (mode === "pickup") setMode("dropoff");
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
        Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
      </div>
    );
  }

  return (
    <div>
      {!readOnly && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-line text-sm">
            {(["pickup", "dropoff"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={`px-3 py-1.5 ${mode === k ? "bg-royal text-white" : "bg-surface text-ink"}`}
              >
                Set {k}
              </button>
            ))}
          </div>
          <div className="flex flex-1 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), runSearch())}
              placeholder={`Search an address for ${mode}…`}
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={runSearch}
              className="rounded-lg border border-royal px-3 py-1.5 text-sm text-royal"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <ul className="mb-2 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="w-full px-3 py-2 text-left hover:bg-canvas"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={container} style={{ height }} className="w-full overflow-hidden rounded-xl" />

      {!readOnly && (
        <p className="mt-2 text-xs text-muted">
          Click the map or search to place the {mode} pin. Blue = pickup, gold = drop-off.
        </p>
      )}
    </div>
  );
}
