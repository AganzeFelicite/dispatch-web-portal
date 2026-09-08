"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import type { IssueView } from "@/lib/types";

const CATEGORY: Record<string, string> = {
  DRIVER_LATE: "Driver late",
  GOODS_DAMAGED: "Goods damaged",
  WRONG_FARE: "Wrong fare",
  BEHAVIOUR: "Behaviour",
  CUSTOMER_UNREACHABLE: "Customer unreachable",
  WRONG_ADDRESS: "Wrong address",
  GOODS_MISMATCH: "Goods mismatch",
  PAYMENT: "Payment",
  OTHER: "Other",
};

/** Support queue: problems reported from the customer and driver apps, resolved here with a note. */
export default function IssuesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"OPEN" | "RESOLVED" | "">("OPEN");
  const list = useQuery({
    queryKey: ["issues", status],
    queryFn: () => api.get<IssueView[]>(`/issues${status ? `?status=${status}` : ""}`),
    refetchInterval: 30_000,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const resolve = useMutation({
    mutationFn: (id: string) => api.post(`/issues/${id}/resolve`, { resolution: notes[id] ?? "" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Issues</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "OPEN" | "RESOLVED" | "")}
          className="rounded-lg border border-line px-2 py-2 text-sm"
        >
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="">All</option>
        </select>
      </div>
      {list.isLoading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {list.data && list.data.length === 0 && <p className="mt-6 text-sm text-muted">Nothing here.</p>}
      <ul className="mt-4 space-y-3">
        {list.data?.map((i) => (
          <li key={i.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-sm">
                <span className="font-semibold text-ink">{CATEGORY[i.category] ?? i.category}</span>
                <span className="text-muted"> · {i.reportedBy === "DRIVER" ? "Driver" : "Customer"} · </span>
                {i.bookingReference ? (
                  <Link href={`/bookings/${i.bookingId}`} className="text-royal hover:underline">
                    #{i.bookingReference}
                  </Link>
                ) : (
                  <span className="text-muted">booking</span>
                )}
              </div>
              <div className="text-xs text-muted">{i.createdAt.slice(0, 16).replace("T", " ")}</div>
            </div>
            <p className="mt-2 text-sm">{i.message}</p>
            {i.status === "RESOLVED" ? (
              <p className="mt-2 text-sm text-green-700">Resolved{i.resolution ? `: ${i.resolution}` : ""}</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <input
                  value={notes[i.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [i.id]: e.target.value })}
                  placeholder="Resolution note"
                  className="min-w-[240px] flex-1 rounded-lg border border-line px-2 py-2 text-sm"
                />
                <button
                  onClick={() => resolve.mutate(i.id)}
                  disabled={resolve.isPending}
                  className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
                >
                  Resolve
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
