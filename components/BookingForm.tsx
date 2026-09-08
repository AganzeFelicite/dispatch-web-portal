"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import MapPicker, { type LatLngText } from "@/components/MapPicker";
import { api } from "@/lib/api";
import { money, tierLabel, titleCase } from "@/lib/format";
import { TIERS, type QuoteResult, type VehicleTier } from "@/lib/types";

type Draft = { text: string; lat: number | null; lng: number | null };
const empty: Draft = { text: "", lat: null, lng: null };

/**
 * Route + vehicle + quote + create. One form for two callers:
 *  - ops console  (`/bookings/quote`, `/bookings` with a customerId)
 *  - business portal (`/customer/quote`, `/customer/bookings`, plus payment / receiver / schedule)
 */
export function BookingForm({
  quotePath,
  createPath,
  extraBody = {},
  portal = false,
  disabled = false,
  onCreated,
}: {
  quotePath: string;
  createPath: string;
  /** Merged into the create body (ops: `{ customerId }`). */
  extraBody?: Record<string, unknown>;
  /** Show the fields the customer API accepts that the ops API does not. */
  portal?: boolean;
  /** Ops: no customer selected yet. */
  disabled?: boolean;
  onCreated: (created: { id: string; reference: string }) => void;
}) {
  const [tier, setTier] = useState<VehicleTier>("PICKUP");
  const [pickup, setPickup] = useState<Draft>(empty);
  const [dropoff, setDropoff] = useState<Draft>(empty);
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOMO">("MOMO");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [goodsType, setGoodsType] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const route = () => ({
    tier,
    pickup: { text: pickup.text, lat: pickup.lat, lng: pickup.lng },
    dropoff: { text: dropoff.text, lat: dropoff.lat, lng: dropoff.lng },
    distanceKm: distanceKm ? Number(distanceKm) : null,
  });

  const getQuote = useMutation({
    mutationFn: () => api.post<QuoteResult>(quotePath, route()),
    onSuccess: (q) => {
      setQuote(q);
      setError(null);
    },
    onError: (e) => setError((e as Error).message),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<{ id: string; reference: string }>(createPath, {
        ...extraBody,
        ...route(),
        notes: notes || null,
        ...(portal
          ? {
              paymentMethod,
              receiverName: receiverName || null,
              receiverPhone: receiverPhone || null,
              goodsType: goodsType || null,
              scheduledAt: scheduledAt || null,
            }
          : {}),
      }),
    onSuccess: onCreated,
    onError: (e) => setError((e as Error).message),
  });

  function onMapChange(n: { pickup: LatLngText | null; dropoff: LatLngText | null }) {
    if (n.pickup) setPickup(n.pickup);
    if (n.dropoff) setDropoff(n.dropoff);
  }

  const mapPickup = pickup.lat != null && pickup.lng != null ? (pickup as LatLngText) : null;
  const mapDropoff = dropoff.lat != null && dropoff.lng != null ? (dropoff as LatLngText) : null;
  const field = "w-full rounded-lg border border-line px-2 py-2";
  const ready = !!pickup.text && !!dropoff.text;

  return (
    <>
      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">{portal ? "1 · Route" : "2 · Route"}</h2>
        <MapPicker pickup={mapPickup} dropoff={mapDropoff} onChange={onMapChange} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Pickup</span>
            <input value={pickup.text} onChange={(e) => setPickup({ text: e.target.value, lat: null, lng: null })} className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Drop-off</span>
            <input value={dropoff.text} onChange={(e) => setDropoff({ text: e.target.value, lat: null, lng: null })} className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Vehicle</span>
            <select value={tier} onChange={(e) => setTier(e.target.value as VehicleTier)} className={field}>
              {TIERS.map((t) => (
                <option key={t} value={t}>{tierLabel(t, true)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Distance (km, if no pins)</span>
            <input value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className={field} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted">Notes for the driver</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
        </label>
        <button
          onClick={() => getQuote.mutate()}
          disabled={!ready || getQuote.isPending}
          className="mt-3 rounded-lg border border-royal px-4 py-2 text-sm text-royal hover:bg-canvas disabled:opacity-60"
        >
          Get quote
        </button>
        {quote && (
          <p className="mt-3 text-sm">
            Quote: <span className="font-semibold text-navy">{money(quote.price)}</span> · {quote.distanceKm} km ·{" "}
            {titleCase(quote.breakdown.applied)}
          </p>
        )}
      </section>

      {portal && (
        <section className="mb-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">2 · Delivery details</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted">Goods</span>
              <input value={goodsType} onChange={(e) => setGoodsType(e.target.value)} placeholder="Fresh produce, documents, furniture…" className={field} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Payment</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "MOMO")} className={field}>
                <option value="MOMO">Mobile Money after delivery</option>
                <option value="CASH">Cash to the driver</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Receiver name</span>
              <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className={field} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Receiver phone</span>
              <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="+2507…" className={field} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-muted">Pickup time (leave empty for now)</span>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={field} />
            </label>
          </div>
        </section>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={() => create.mutate()}
        disabled={disabled || !ready || create.isPending}
        className="rounded-lg bg-royal px-5 py-2.5 font-medium text-white hover:bg-blue disabled:opacity-60"
      >
        {create.isPending ? "Booking…" : portal ? "Book this trip" : "Create booking"}
      </button>
    </>
  );
}
