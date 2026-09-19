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
    mutationFn: (v: { id: string; providerRef: string }) =>
      api.post(`/payouts/${v.id}/mark-sent`, { providerRef: v.providerRef || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payouts"] }),
  });
  const markFailed = useMutation({
    mutationFn: (v: { id: string; reason: string }) =>
      api.post(`/payouts/${v.id}/mark-failed`, { reason: v.reason || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payouts"] }),
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-navy">Payouts</h1>
      <p className="mb-6 text-sm text-muted">
        A driver requests a payout of their ledger balance; the amount is reserved at once. Send it by
        MoMo and mark it sent with the transaction id — or mark it failed and the amount returns to
        their ledger.
      </p>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
      {data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{p.driverName}</td>
                  <td className="px-4 py-3 text-xs text-muted">{p.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3">{money(p.amount)}</td>
                  <td className="px-4 py-3 text-xs">
                    {titleCase(p.status)}
                    {p.failureReason && <span className="block text-red-600">{p.failureReason}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.providerRef ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.status === "PENDING" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const ref = window.prompt("MoMo transaction id (optional)") ?? "";
                            markSent.mutate({ id: p.id, providerRef: ref });
                          }}
                          disabled={markSent.isPending || markFailed.isPending}
                          className="text-xs text-royal hover:underline"
                        >
                          Mark sent
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt("Why did it fail?") ?? "";
                            markFailed.mutate({ id: p.id, reason });
                          }}
                          disabled={markSent.isPending || markFailed.isPending}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Mark failed
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
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
