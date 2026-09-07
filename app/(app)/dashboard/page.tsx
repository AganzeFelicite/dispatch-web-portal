"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, downloadFile } from "@/lib/api";
import { money } from "@/lib/format";
import type { DailyMetrics } from "@/lib/types";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-navy">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [date, setDate] = useState(today());
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const { data, isLoading, error } = useQuery({
    queryKey: ["metrics", date],
    queryFn: () => api.get<DailyMetrics>(`/metrics/daily?date=${date}`),
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
          <p className="text-sm text-muted">The day&apos;s operating numbers.</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </header>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Could not load metrics"}
        </p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Tile label="Bookings" value={String(data.bookings)} />
          <Tile label="Completed" value={String(data.completed)} />
          <Tile label="Cancelled" value={String(data.cancelled)} />
          <Tile label="GBV" value={money(data.gbv)} />
          <Tile label="Payments" value={String(data.paidCount)} />
          <Tile label="Collected" value={money(data.collected)} />
          <Tile label="Commission" value={money(data.commission)} />
          <Tile label="Driver payouts" value={money(data.driverPayout)} />
        </div>
      )}

      <section className="mt-10 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold text-navy">Export bookings (CSV)</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-line px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-line px-3 py-2"
            />
          </label>
          <button
            onClick={() =>
              downloadFile(`/reports/bookings.csv?from=${from}&to=${to}`, `bookings_${from}_${to}.csv`)
            }
            className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue"
          >
            Download CSV
          </button>
        </div>
      </section>
    </div>
  );
}
