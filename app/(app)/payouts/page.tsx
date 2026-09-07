"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { money, titleCase } from "@/lib/format";
import type { Payout } from "@/lib/types";

export default function PayoutsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["payouts"],
    queryFn: () => api.get<Payout[]>("/payouts?limit=200"),
  });

  const markSent = useMutation({
    mutationFn: (id: string) => api.post(`/payouts/${id}/mark-sent`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payouts"] }),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-navy">Payouts</h1>
      <p className="mb-6 text-sm text-muted">
        Created automatically when a payment settles. Mark one sent once you&apos;ve paid the driver.
      </p>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
      {data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{p.driverName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.bookingReference ?? "—"}</td>
                  <td className="px-4 py-3">{money(p.amount)}</td>
                  <td className="px-4 py-3 text-xs">{titleCase(p.status)}</td>
                  <td className="px-4 py-3">
                    {p.status === "PENDING" && (
                      <button
                        onClick={() => markSent.mutate(p.id)}
                        disabled={markSent.isPending}
                        className="text-xs text-royal hover:underline"
                      >
                        Mark sent
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No payouts yet.
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
