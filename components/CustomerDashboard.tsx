"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bars, Columns } from "@/components/Columns";
import { api, downloadFile } from "@/lib/api";
import { money, tierLabel } from "@/lib/format";
import type { BookingRow, CustomerDashboard as Summary, Paginated } from "@/lib/types";

/** Local calendar date (not UTC) as YYYY-MM-DD. */
function isoDay(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-navy">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Finding driver",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/**
 * The account dashboard a business sees: spend and trips over a period, per day and per vehicle,
 * plus its recent trips and a CSV statement. Used by the ops console (per customer) and the portal.
 *
 * `summaryPath` / `tripsPath` / `csvPath` point at the customer-scoped or ops-scoped endpoints.
 */
export function CustomerDashboard({
  summaryPath,
  tripsPath,
  csvPath,
  tripHref,
}: {
  summaryPath: string;
  tripsPath: string;
  csvPath: string;
  /** Where a trip row links to (ops: booking detail; portal: nothing). */
  tripHref?: (b: BookingRow) => string;
}) {
  const now = new Date();
  const [from, setFrom] = useState(isoDay(new Date(now.getTime() - 29 * 86_400_000)));
  const [to, setTo] = useState(isoDay(now));
  const range = `from=${from}&to=${to}`;

  const summary = useQuery({
    queryKey: ["customer-dashboard", summaryPath, from, to],
    queryFn: () => api.get<Summary>(`${summaryPath}?${range}`),
  });
  const trips = useQuery({
    queryKey: ["customer-trips", tripsPath],
    queryFn: () => api.get<Paginated<BookingRow>>(tripsPath),
  });

  const s = summary.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">From</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line px-3 py-2" />
        </label>
        <button
          onClick={() => downloadFile(`${csvPath}?${range}`, `dispatch_trips_${from}_${to}.csv`)}
          className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue"
        >
          Download statement (CSV)
        </button>
      </div>

      {summary.isLoading && <p className="text-sm text-muted">Loading…</p>}
      {summary.error && <p className="text-sm text-red-600">{summary.error.message}</p>}

      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Tile label="Spend" value={money(s.spend)} hint="quoted fares, cancelled excluded" />
            <Tile label="Trips" value={String(s.trips)} hint={`${s.completed} completed · ${s.cancelled} cancelled`} />
            <Tile label="Average fare" value={money(s.avgFare)} />
            <Tile label="In progress" value={String(s.active)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-base font-semibold text-navy">Trips per day</h2>
              <Columns
                data={s.byDay.map((d) => ({
                  label: d.date.slice(5),
                  value: d.trips,
                  detail: `${d.trips} trip${d.trips === 1 ? "" : "s"} · ${money(d.spend)}`,
                }))}
              />
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="mb-3 text-base font-semibold text-navy">Spend by vehicle</h2>
              <Bars
                data={s.byTier.map((t) => ({ label: tierLabel(t.tier), value: t.spend, detail: `${t.trips} trips` }))}
                format={money}
              />
            </section>
          </div>
        </>
      )}

      <section className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3 text-right">Fare</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.data?.items.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  {tripHref ? (
                    <a href={tripHref(b)} className="text-royal hover:underline">{b.reference}</a>
                  ) : (
                    b.reference
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{b.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3">{tierLabel(b.tier)}</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted">{b.pickupText} → {b.dropoffText}</td>
                <td className="px-4 py-3">{b.assignedDriverName ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{money(b.quotedPrice)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{STATUS_LABEL[b.status] ?? b.status}</td>
              </tr>
            ))}
            {trips.data && trips.data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">No trips yet.</td>
              </tr>
            )}
            {trips.error && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-red-600">{trips.error.message}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
