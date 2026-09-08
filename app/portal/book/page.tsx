"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";

/** Business portal: book a trip on the account. Same pipeline as the customer app (auto-assign, SMS/push). */
export default function PortalBookPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <Link href="/portal" className="text-sm text-muted hover:underline">← Your account</Link>
      <h1 className="mb-6 mt-1 text-2xl font-semibold text-navy">Book a trip</h1>
      <BookingForm
        quotePath="/customer/quote"
        createPath="/customer/bookings"
        portal
        onCreated={(b) => router.push(`/portal?booked=${encodeURIComponent(b.reference)}`)}
      />
    </div>
  );
}
