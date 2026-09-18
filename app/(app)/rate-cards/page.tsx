"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { money, tierLabel } from "@/lib/format";
import { TIERS, type Paginated, type RateCard, type VehicleTier } from "@/lib/types";

export default function RateCardsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["rate-cards"],
    queryFn: () => api.get<Paginated<RateCard>>("/rate-cards?limit=100"),
  });

  const [tier, setTier] = useState<VehicleTier>("PICKUP");
  const [zone, setZone] = useState("kigali");
  const [baseFare, setBaseFare] = useState("5000");
  const [perKm, setPerKm] = useState("1200");
  const [minFare, setMinFare] = useState("10000");
  const [takeRatePct, setTakeRatePct] = useState("15");

  const create = useMutation({
    mutationFn: () =>
      api.post("/rate-cards", {
        tier,
        zone,
        baseFare: Number(baseFare),
        perKm: Number(perKm),
        minFare: Number(minFare),
        takeRatePct: Number(takeRatePct),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-cards"] }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) =>
      api.patch(`/rate-cards/${v.id}`, { active: v.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-cards"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-navy">Rate cards</h1>

      <section className="mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-navy">New rate card</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as VehicleTier)}
              className="w-full rounded-lg border border-line px-2 py-2"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {tierLabel(t, true)}
                </option>
              ))}
            </select>
          </label>
          <Field label="Zone" value={zone} onChange={setZone} />
          <Field label="Base fare" value={baseFare} onChange={setBaseFare} />
          <Field label="Per km" value={perKm} onChange={setPerKm} />
          <Field label="Min fare" value={minFare} onChange={setMinFare} />
          <Field label="Take %" value={takeRatePct} onChange={setTakeRatePct} />
        </div>
        {create.error && (
          <p className="mt-2 text-sm text-red-600">{(create.error as Error).message}</p>
        )}
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="mt-3 rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
        >
          {create.isPending ? "Saving…" : "Create (supersedes active)"}
        </button>
      </section>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
      {data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Per km</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Take %</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{tierLabel(c.tier, true)}</td>
                  <td className="px-4 py-3">{c.zone}</td>
                  <td className="px-4 py-3">{money(c.baseFare)}</td>
                  <td className="px-4 py-3">{money(c.perKm)}</td>
                  <td className="px-4 py-3">{money(c.minFare)}</td>
                  <td className="px-4 py-3">{c.takeRatePct}%</td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        active
                      </span>
                    ) : (
                      <span className="text-xs text-muted">inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle.mutate({ id: c.id, active: !c.active })}
                      className="text-xs text-royal hover:underline"
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line px-2 py-2"
      />
    </label>
  );
}
