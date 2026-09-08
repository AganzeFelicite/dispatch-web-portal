"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestCustomerOtp, verifyCustomerOtp } from "@/lib/api";
import { storeCustomerSession } from "@/lib/auth";

/** Phone + one-time code, the same sign-in as the customer app. */
export default function PortalLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!sent) {
        const r = await requestCustomerOtp(phone.trim());
        setSent(true);
        setHint(r.devCode ? `Dev code: ${r.devCode}` : "We sent a code to your phone.");
      } else {
        storeCustomerSession(await verifyCustomerOtp(phone.trim(), code.trim()));
        router.replace("/portal");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-xl">
        <div className="mb-6">
          <div className="text-2xl font-semibold text-navy">Dispatch for Business</div>
          <p className="mt-1 text-sm text-muted">Sign in with the phone number on your account.</p>
        </div>
        <label className="mb-1 block text-sm font-medium text-ink" htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+2507…"
          value={phone}
          disabled={sent}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-blue disabled:bg-canvas"
        />
        {sent && (
          <>
            <label className="mb-1 block text-sm font-medium text-ink" htmlFor="code">Code</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mb-4 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-blue"
            />
          </>
        )}
        {hint && <p className="mb-4 text-sm text-muted">{hint}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-royal py-2 font-medium text-white transition hover:bg-blue disabled:opacity-60"
        >
          {busy ? "…" : sent ? "Sign in" : "Send code"}
        </button>
        {sent && (
          <button type="button" onClick={() => { setSent(false); setCode(""); setHint(null); }} className="mt-3 w-full text-sm text-muted hover:underline">
            Use a different number
          </button>
        )}
      </form>
    </main>
  );
}
