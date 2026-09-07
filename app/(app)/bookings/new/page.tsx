"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MapPicker, { type LatLngText } from "@/components/MapPicker";
import { api } from "@/lib/api";
import { money, tierLabel, titleCase } from "@/lib/format";
import { TIERS, type CustomerRow, type Paginated, type QuoteResult, type VehicleTier } from "@/lib/types";

type Draft = { text: string; lat: number | null; lng: number | null };
const empty: Draft = { text: "", lat: null, lng: null };

export default function NewBookingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [newName, setNewName] = useState("");
  const [tier, setTier] = useState<VehicleTier>("PICKUP");
  const [pickup, setPickup] = useState<Draft>(empty);
  const [dropoff, setDropoff] = useState<Draft>(empty);
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findCustomer = useMutation({
    mutationFn: () =>
      api.get<Paginated<CustomerRow>>(`/customers?phone=${encodeURIComponent(phone.trim())}`),
    onSuccess: (res) => setCustomer(res.items[0] ?? null),
  });
  const createCustomer = useMutation({
    mutationFn: () => api.post<{ id: string }>("/customers", { name: newName, phone: phone.trim() }),
    onSuccess: async () => {
      const res = await api.get<Paginated<CustomerRow>>(
        `/customers?phone=${encodeURIComponent(phone.trim())}`,
      );
      setCustomer(res.items[0] ?? null);
    },
  });

  const body = () => ({
    tier,
    pickup: { text: pickup.text, lat: pickup.lat, lng: pickup.lng },
    dropoff: { text: dropoff.text, lat: dropoff.lat, lng: dropoff.lng },
    distanceKm: distanceKm ? Number(distanceKm) : null,
  });

  const getQuote = useMutation({
    mutationFn: () => api.post<QuoteResult>("/bookings/quote", body()),
    onSuccess: (q) => {
      setQuote(q);
      setError(null);
    },
    onError: (e) => setError((e as Error).message),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>("/bookings", { customerId: customer!.id, ...body(), notes: notes || null }),
    onSuccess: (b) => router.push(`/bookings/${b.id}`),
    onError: (e) => setError((e as Error).message),
  });

  function onMapChange(n: { pickup: LatLngText | null; dropoff: LatLngText | null }) {
    if (n.pickup) setPickup(n.pickup);
    if (n.dropoff) setDropoff(n.dropoff);
  }

  const mapPickup = pickup.lat != null && pickup.lng != null ? (pickup as LatLngText) : null;
  const mapDropoff = dropoff.lat != null && dropoff.lng != null ? (dropoff as LatLngText) : null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-navy">New booking</h1>

      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">1 · Customer</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2507…"
              className="rounded-lg border border-line px-3 py-2"
            />
          </label>
          <button
            onClick={() => findCustomer.mutate()}
            className="rounded-lg border border-royal px-4 py-2 text-sm text-royal hover:bg-canvas"
          >
            Find
          </button>
        </div>
        {customer ? (
          <p className="mt-3 text-sm text-green-700">
            Selected: {customer.name} ({customer.phone})
          </p>
        ) : (
          findCustomer.isSuccess && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <p className="w-full text-sm text-muted">No match — create a new customer:</p>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-lg border border-line px-3 py-2"
                />
              </label>
              <button
                onClick={() => createCustomer.mutate()}
                disabled={!newName}
                className="rounded-lg bg-royal px-4 py-2 text-sm text-white hover:bg-blue disabled:opacity-60"
              >
                Create
              </button>
            </div>
          )
        )}
      </section>

      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">2 · Route</h2>
        <MapPicker pickup={mapPickup} dropoff={mapDropoff} onChange={onMapChange} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Pickup</span>
            <input
              value={pickup.text}
              onChange={(e) => setPickup({ text: e.target.value, lat: null, lng: null })}
              className="w-full rounded-lg border border-line px-2 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Drop-off</span>
            <input
              value={dropoff.text}
              onChange={(e) => setDropoff({ text: e.target.value, lat: null, lng: null })}
              className="w-full rounded-lg border border-line px-2 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as VehicleTier)}
              className="w-full rounded-lg border border-line px-2 py-2"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {tierLabel(t, true)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Distance (km, if no pins)</span>
            <input
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full rounded-lg border border-line px-2 py-2"
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted">Notes</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-line px-2 py-2"
          />
        </label>
        <button
          onClick={() => getQuote.mutate()}
          disabled={!pickup.text || !dropoff.text}
          className="mt-3 rounded-lg border border-royal px-4 py-2 text-sm text-royal hover:bg-canvas disabled:opacity-60"
        >
          Get quote
        </button>
        {quote && (
          <p className="mt-3 text-sm">
            Quote: <span className="font-semibold text-navy">{money(quote.price)}</span> ·{" "}
            {quote.distanceKm} km · {titleCase(quote.breakdown.applied)}
          </p>
        )}
      </section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={() => create.mutate()}
        disabled={!customer || !pickup.text || !dropoff.text || create.isPending}
        className="rounded-lg bg-royal px-5 py-2.5 font-medium text-white hover:bg-blue disabled:opacity-60"
      >
        {create.isPending ? "Creating…" : "Create booking"}
      </button>
    </div>
  );
}
