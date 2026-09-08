"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getCustomer, getToken } from "@/lib/auth";

/**
 * Business portal shell. Same Next app as the ops console, separate entry (/portal), customer
 * sign-in (phone + OTP). Nothing here can reach ops routes: the backend scopes a customer token
 * to /api/customer/*.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/portal/login";

  useEffect(() => {
    if (!isLogin && !(getToken() && getCustomer())) router.replace("/portal/login");
    else setReady(true);
  }, [router, isLogin]);

  if (!ready) return null;
  if (isLogin) return <>{children}</>;

  const customer = getCustomer();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between bg-navy px-6 py-4 text-white">
        <div>
          <div className="text-lg font-semibold">Dispatch for Business</div>
          <div className="text-xs text-white/60">{customer?.name} · {customer?.phone}</div>
        </div>
        <button
          onClick={() => {
            clearSession();
            router.replace("/portal/login");
          }}
          className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Sign out
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
