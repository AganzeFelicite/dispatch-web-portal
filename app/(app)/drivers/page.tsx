"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { money, tierLabel, titleCase } from "@/lib/format";
import {
  TIERS,
  type DriverDetail,
  type DriverRow,
  type Paginated,
  type VehicleTier,
} from "@/lib/types";

interface Earnings {
  trips: number;
  gross: number;
  commission: number;
  payout: number;
}

export default function DriversPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["drivers"],
    queryFn: () => api.get<Paginated<DriverRow>>("/drivers?limit=100"),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [momo, setMomo] = useState("");

  const onboard = useMutation({
    mutationFn: () =>
      api.post("/drivers", { name, phone, momoNumber: momo || null }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setMomo("");
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-navy">Drivers</h1>

      <section className="mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-lg font-semibold text-navy">Onboard a driver</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="MoMo (optional)" value={momo} onChange={setMomo} />
          <div className="flex items-end">
            <button
              onClick={() => onboard.mutate()}
              disabled={onboard.isPending || !name || !phone}
              className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
            >
              {onboard.isPending ? "Saving…" : "Add driver"}
            </button>
          </div>
        </div>
        {onboard.error && (
          <p className="mt-2 text-sm text-red-600">{(onboard.error as Error).message}</p>
        )}
      </section>

      {list.isLoading && <p className="text-sm text-muted">Loading…</p>}
      {list.error && <p className="text-sm text-red-600">{(list.error as Error).message}</p>}
      {list.data && (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((d) => (
                <tr
                  key={d.id}
                  className={`cursor-pointer border-b border-line last:border-0 hover:bg-canvas/60 ${
                    selected === d.id ? "bg-canvas" : ""
                  }`}
                  onClick={() => setSelected(d.id)}
                >
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.phone}</td>
                  <td className="px-4 py-3 text-xs">{titleCase(d.status)}</td>
                  <td className="px-4 py-3 text-xs text-royal">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <DriverPanel key={selected} id={selected} />}
    </div>
  );
}

function DriverPanel({ id }: { id: string }) {
  const qc = useQueryClient();
  const detail = useQuery({
    queryKey: ["driver", id],
    queryFn: () => api.get<DriverDetail>(`/drivers/${id}`),
  });
  const earnings = useQuery({
    queryKey: ["driver-earnings", id],
    queryFn: () => api.get<Earnings>(`/drivers/${id}/earnings`),
  });

  const verify = useMutation({
    mutationFn: () => api.post(`/drivers/${id}/verify`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver", id] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
  });

  const [tier, setTier] = useState<VehicleTier>("PICKUP");
  const [plate, setPlate] = useState("");
  const addVehicle = useMutation({
    mutationFn: () => api.post(`/drivers/${id}/vehicles`, { tier, plate }),
    onSuccess: () => {
      setPlate("");
      qc.invalidateQueries({ queryKey: ["driver", id] });
    },
  });

  if (detail.isLoading) return <p className="mt-6 text-sm text-muted">Loading driver…</p>;
  if (detail.error || !detail.data)
    return <p className="mt-6 text-sm text-red-600">Could not load driver.</p>;

  const d = detail.data;
  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">{d.name}</h2>
          <p className="text-sm text-muted">
            {d.phone} · {titleCase(d.status)}
          </p>
        </div>
        {d.status !== "VERIFIED" && (
          <button
            onClick={() => verify.mutate()}
            disabled={verify.isPending}
            className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
          >
            {verify.isPending ? "…" : "Verify"}
          </button>
        )}
      </div>

      {earnings.data && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Mini label="Paid trips" value={String(earnings.data.trips)} />
          <Mini label="Gross" value={money(earnings.data.gross)} />
          <Mini label="Commission" value={money(earnings.data.commission)} />
          <Mini label="Payout" value={money(earnings.data.payout)} />
        </div>
      )}

      <h3 className="mt-6 text-sm font-semibold text-ink">Vehicles</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {d.vehicles.length === 0 && <li className="text-muted">No vehicles yet.</li>}
        {d.vehicles.map((v) => (
          <li key={v.id} className="flex gap-3">
            <span className="font-mono">{v.plate}</span>
            <span className="text-muted">{tierLabel(v.tier)}</span>
            {v.makeModel && <span className="text-muted">· {v.makeModel}</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Tier</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as VehicleTier)}
            className="rounded-lg border border-line px-2 py-2"
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {tierLabel(t, true)}
              </option>
            ))}
          </select>
        </label>
        <Field label="Plate" value={plate} onChange={setPlate} />
        <button
          onClick={() => addVehicle.mutate()}
          disabled={addVehicle.isPending || !plate}
          className="rounded-lg border border-royal px-4 py-2 text-sm font-medium text-royal hover:bg-canvas disabled:opacity-60"
        >
          Add vehicle
        </button>
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-semibold text-navy">{value}</div>
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
