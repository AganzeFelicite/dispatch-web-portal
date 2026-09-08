"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money, tierLabel, titleCase } from "@/lib/format";
import type { BookingRow, BookingStatus, Paginated } from "@/lib/types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  ASSIGNED: "bg-blue-100 text-blue-800",
  PICKED_UP: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {titleCase(status)}
    </span>
  );
}

const SERVICES = [
  { key: "", label: "All" },
  { key: "GOODS", label: "Goods" },
  { key: "RIDE", label: "Rides" },
] as const;

export default function BookingsPage() {
  const [service, setService] = useState<string>("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", service],
    queryFn: () =>
      api.get<Paginated<BookingRow>>(`/bookings?limit=50${service ? `&serviceType=${service}` : ""}`),
  });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Today board</h1>
          <p className="text-sm text-muted">Every booking, newest first.</p>
        </div>
        <Link
          href="/bookings/new"
          className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue"
        >
          New booking
        </Link>
      </header>

      <div className="mb-4 flex overflow-hidden rounded-lg border border-line text-sm w-fit">
        {SERVICES.map((s) => (
          <button
            key={s.key}
            onClick={() => setService(s.key)}
            className={`px-4 py-1.5 ${service === s.key ? "bg-royal text-white" : "bg-surface text-ink hover:bg-canvas"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

      {data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link href={`/bookings/${b.id}`} className="text-royal hover:underline">
                      {b.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {tierLabel(b.tier)}
                    {b.serviceType === "RIDE" && (
                      <span className="ml-2 rounded-full bg-royal/10 px-2 py-0.5 text-[10px] font-medium text-royal">Ride</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {b.pickupText} → {b.dropoffText}
                  </td>
                  <td className="px-4 py-3">{b.assignedDriverName ?? "—"}</td>
                  <td className="px-4 py-3">{money(b.quotedPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
