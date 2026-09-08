"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getStaff, getToken } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/customers", label: "Customers" },
  { href: "/drivers", label: "Drivers" },
  { href: "/rate-cards", label: "Rate cards" },
  { href: "/payouts", label: "Payouts" },
  { href: "/issues", label: "Issues" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const staff = getStaff();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col bg-navy px-4 py-6 text-white">
        <div className="mb-8 px-2 text-xl font-semibold">Dispatch</div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-royal text-white" : "text-white/70 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 text-sm">
          <div className="px-2 text-white/80">{staff?.name}</div>
          <div className="px-2 text-xs text-white/50">{staff?.role}</div>
          <button
            onClick={signOut}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
