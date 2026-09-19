"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api, apiFetch } from "@/lib/api";
import { useVehicleTypes } from "@/lib/vehicleTypes";
import type { VehicleType } from "@/lib/types";

/**
 * Vehicle types are data. Adding one here makes it bookable everywhere — the ops booking form, the
 * customer app's vehicle grid, the driver app's labels — with no deploy. It is not quotable until
 * it has an active rate card, which is the next screen along.
 */
export default function VehicleTypesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useVehicleTypes(true);
  const refresh = () => qc.invalidateQueries({ queryKey: ["vehicle-types"] });

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("");
  const [blurb, setBlurb] = useState("");
  const [sortOrder, setSortOrder] = useState("100");

  const create = useMutation({
    mutationFn: () =>
      api.post("/vehicle-types", {
        code: code.trim().toUpperCase().replace(/\s+/g, "_"),
        label: label.trim(),
        capacity: capacity.trim(),
        blurb: blurb.trim() || null,
        sortOrder: Number(sortOrder) || 100,
      }),
    onSuccess: () => {
      setCode("");
      setLabel("");
      setCapacity("");
      setBlurb("");
      refresh();
    },
  });

  const update = useMutation({
    mutationFn: (v: { id: string; body: Partial<VehicleType> }) =>
      api.patch(`/vehicle-types/${v.id}`, v.body),
    onSuccess: refresh,
  });

  const field = "w-full rounded-lg border border-line px-3 py-2";

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-navy">Vehicle types</h1>
        <p className="mt-1 text-sm text-muted">
          What customers can book. A new type needs an active rate card before it can be quoted.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Add a type</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="MINI_TRUCK"
              className={`${field} font-mono`}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Name</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Mini Truck" className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Capacity</span>
            <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="up to 2 tonnes" className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Blurb</span>
            <input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Big loads" className={field} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Order</span>
            <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={field} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          The code is stored on every booking and cannot be changed later. Upper snake case, e.g.{" "}
          <code className="font-mono">CARGO_MOTO</code>.
        </p>
        <button
          onClick={() => create.mutate()}
          disabled={!code.trim() || !label.trim() || !capacity.trim() || create.isPending}
          className="mt-4 rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-50"
        >
          {create.isPending ? "Adding…" : "Add type"}
        </button>
        {create.error && (
          <p className="mt-2 text-sm text-red-600">{(create.error as Error).message}</p>
        )}
      </section>

      {isLoading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((t) => (
          <TypeCard key={t.id} type={t} onChanged={refresh} onUpdate={update.mutate} />
        ))}
      </div>
    </div>
  );
}

function TypeCard({
  type,
  onChanged,
  onUpdate,
}: {
  type: VehicleType;
  onChanged: () => void;
  onUpdate: (v: { id: string; body: Partial<VehicleType> }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      // No Content-Type header: the browser sets the multipart boundary itself.
      await apiFetch(`/vehicle-types/${type.id}/image`, { method: "POST", body });
      onChanged();
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`rounded-xl border border-line bg-surface p-5 ${type.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-4">
        <div className="grid h-20 w-20 flex-none place-items-center rounded-lg bg-canvas">
          {type.imageUrl ? (
            // Remote, ops-uploaded, and may be an SVG — a plain img keeps all three simple.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={type.imageUrl} alt={type.label} className="max-h-16 max-w-16" />
          ) : (
            <span className="text-xs text-muted">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-ink">{type.label}</h3>
            {!type.isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                Retired
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-muted">{type.code}</p>
          <p className="mt-1 text-sm text-muted">{type.capacity}</p>
          {type.blurb && <p className="text-sm text-muted">{type.blurb}</p>}
          <p className="mt-1 text-xs text-muted">Order {type.sortOrder}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-canvas disabled:opacity-50"
        >
          {uploading ? "Uploading…" : type.imageUrl ? "Replace image" : "Upload image"}
        </button>
        <button
          onClick={() => onUpdate({ id: type.id, body: { isActive: !type.isActive } })}
          className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-canvas"
        >
          {type.isActive ? "Retire" : "Bring back"}
        </button>
      </div>
      {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
    </div>
  );
}
