"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CustomerDashboard } from "@/components/CustomerDashboard";

function BookedBanner() {
  const ref = useSearchParams().get("booked");
  if (!ref) return null;
  return (
    <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      Trip <span className="font-mono">{ref}</span> booked. We are finding the nearest driver; you will get a message when one accepts.
    </p>
  );
}

export default function PortalHome() {
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Your account</h1>
          <p className="text-sm text-muted">Spend, trips and statements for the period you pick.</p>
        </div>
        <Link href="/portal/book" className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue">
          Book a trip
        </Link>
      </header>
      <Suspense>
        <BookedBanner />
      </Suspense>
      <CustomerDashboard summaryPath="/customer/dashboard" tripsPath="/customer/bookings?limit=50" csvPath="/customer/bookings.csv" />
    </div>
  );
}
