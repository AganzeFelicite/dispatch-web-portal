"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookingForm } from "@/components/BookingForm";
import { api } from "@/lib/api";
import type { CustomerRow, Paginated } from "@/lib/types";

/** Ops: a booking taken by phone / WhatsApp. Find or create the customer, then the shared form. */
export default function NewBookingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [newName, setNewName] = useState("");

  const lookup = () => api.get<Paginated<CustomerRow>>(`/customers?phone=${encodeURIComponent(phone.trim())}`);
  const findCustomer = useMutation({ mutationFn: lookup, onSuccess: (res) => setCustomer(res.items[0] ?? null) });
  const createCustomer = useMutation({
    mutationFn: () => api.post<{ id: string }>("/customers", { name: newName, phone: phone.trim() }),
    onSuccess: async () => setCustomer((await lookup()).items[0] ?? null),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-navy">New booking</h1>

      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">1 · Customer</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2507…" className="rounded-lg border border-line px-3 py-2" />
          </label>
          <button onClick={() => findCustomer.mutate()} className="rounded-lg border border-royal px-4 py-2 text-sm text-royal hover:bg-canvas">
            Find
          </button>
        </div>
        {customer ? (
          <p className="mt-3 text-sm text-green-700">
            Selected: {customer.name} ({customer.phone}){customer.businessName ? ` · ${customer.businessName}` : ""}
          </p>
        ) : (
          findCustomer.isSuccess && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <p className="w-full text-sm text-muted">No match — create a new customer:</p>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Name</span>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="rounded-lg border border-line px-3 py-2" />
              </label>
              <button onClick={() => createCustomer.mutate()} disabled={!newName} className="rounded-lg bg-royal px-4 py-2 text-sm text-white hover:bg-blue disabled:opacity-60">
                Create
              </button>
            </div>
          )
        )}
        {(findCustomer.error || createCustomer.error) && (
          <p className="mt-3 text-sm text-red-600">{(findCustomer.error ?? createCustomer.error)?.message}</p>
        )}
      </section>

      <BookingForm
        quotePath="/bookings/quote"
        createPath="/bookings"
        extraBody={{ customerId: customer?.id }}
        disabled={!customer}
        onCreated={(b) => router.push(`/bookings/${b.id}`)}
      />
    </div>
  );
}
