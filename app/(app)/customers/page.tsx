"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CustomerRow, Paginated } from "@/lib/types";

export default function CustomersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiFetch<Paginated<CustomerRow>>("/customers?limit=50"),
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Customers</h1>
        <p className="text-sm text-muted">Everyone who has requested a move.</p>
      </header>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Could not load customers"}
        </p>
      )}

      {data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Business</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3 text-xs">{c.type.toLowerCase()}</td>
                  <td className="px-4 py-3 text-muted">{c.businessName ?? "—"}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    No customers yet.
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
