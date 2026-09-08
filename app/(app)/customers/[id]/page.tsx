"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerDashboard } from "@/components/CustomerDashboard";
import { api } from "@/lib/api";
import type { CustomerRow } from "@/lib/types";

/** Ops view of one account: the same dashboard the business sees in its portal. */
export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const customer = useQuery({ queryKey: ["customer", id], queryFn: () => api.get<CustomerRow>(`/customers/${id}`) });
  const c = customer.data;

  return (
    <div>
      <header className="mb-6">
        <Link href="/customers" className="text-sm text-muted hover:underline">← Customers</Link>
        <h1 className="mt-1 text-2xl font-semibold text-navy">{c ? (c.businessName ?? c.name) : "…"}</h1>
        {c && (
          <p className="text-sm text-muted">
            {c.businessName ? `${c.name} · ` : ""}
            <span className="font-mono text-xs">{c.phone}</span> · {c.type.toLowerCase()} account
          </p>
        )}
        {customer.error && <p className="text-sm text-red-600">{customer.error.message}</p>}
      </header>
      <CustomerDashboard
        summaryPath={`/customers/${id}/dashboard`}
        tripsPath={`/bookings?customerId=${id}&limit=50`}
        csvPath={`/reports/bookings.csv?customerId=${id}`}
        tripHref={(b) => `/bookings/${b.id}`}
      />
    </div>
  );
}
