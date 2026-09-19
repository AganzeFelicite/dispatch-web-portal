"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import MapPicker from "@/components/MapPicker";
import { ApiError, api } from "@/lib/api";
import { getStaff } from "@/lib/auth";
import { money, tierLabel, titleCase } from "@/lib/format";
import type {
  BookingDetail,
  BookingStatus,
  DriverDetail,
  DriverRow,
  Paginated,
  PaymentView,
  VehicleTier,
} from "@/lib/types";

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "DELIVERED",
  DELIVERED: "COMPLETED",
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const booking = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get<BookingDetail>(`/bookings/${id}`),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  };

  const advance = useMutation({
    mutationFn: (to: BookingStatus) => api.post(`/bookings/${id}/status`, { to }),
    onSuccess: invalidate,
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
    onSuccess: invalidate,
  });
  const autoAssign = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/auto-assign`),
    onSuccess: invalidate,
  });

  if (booking.isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (booking.error || !booking.data)
    return <p className="text-sm text-red-600">{(booking.error as Error)?.message ?? "Not found"}</p>;

  const b = booking.data;
  const next = NEXT_STATUS[b.status];
  const canCancel = b.status !== "COMPLETED" && b.status !== "CANCELLED";
  const payable = b.status === "DELIVERED" || b.status === "COMPLETED";

  return (
    <div className="max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-navy">{b.reference}</h1>
          <p className="text-sm text-muted">
            {titleCase(b.status)}
            {b.awaitingAcceptance && " · waiting for the driver to accept"}
          </p>
        </div>
        <div className="flex gap-2">
          {b.shareUrl && (
            <button
              onClick={() => navigator.clipboard.writeText(b.shareUrl!)}
              title={b.shareUrl}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-navy hover:bg-canvas"
            >
              Copy tracking link
            </button>
          )}
          {b.status === "NEW" && (
            <button
              onClick={() => autoAssign.mutate()}
              disabled={autoAssign.isPending}
              className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
            >
              {autoAssign.isPending ? "Finding driver…" : "Offer to nearest driver"}
            </button>
          )}
          {next && (
            <button
              onClick={() => advance.mutate(next)}
              disabled={advance.isPending}
              className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
            >
              Mark {titleCase(next)}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => cancel.mutate("cancelled from console")}
              disabled={cancel.isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      {(advance.error || cancel.error || autoAssign.error) && (
        <p className="mb-4 text-sm text-red-600">
          {((advance.error || cancel.error || autoAssign.error) as Error).message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Customer">
          <p>{b.customer.name}</p>
          <p className="font-mono text-xs text-muted">{b.customer.phone}</p>
        </Card>
        <Card title="Driver">
          {b.driver ? (
            <>
              <p>{b.driver.name}</p>
              <p className="font-mono text-xs text-muted">{b.driver.phone}</p>
            </>
          ) : (
            <p className="text-muted">Not assigned</p>
          )}
        </Card>
        <Card title="Route">
          <p>{b.pickup.text}</p>
          <p className="text-muted">→ {b.dropoff.text}</p>
          <p className="mt-1 text-xs text-muted">
            {b.distanceKm ?? "—"} km · {tierLabel(b.tier)}
          </p>
        </Card>
        <Card title="Price">
          <p className="text-lg font-semibold text-navy">{money(b.quotedPrice)}</p>
          {(b.receiverName || b.goodsType || b.scheduledAt || b.rating) && (
            <p className="mt-1 text-xs text-muted">
              {b.scheduledAt && <>Scheduled {b.scheduledAt.slice(0, 16).replace("T", " ")} · </>}
              {b.goodsType && <>{b.goodsType} · </>}
              {b.receiverName && <>To {b.receiverName}{b.receiverPhone ? ` (${b.receiverPhone})` : ""} · </>}
              {b.rating && <>Rated {"★".repeat(b.rating)}{b.ratingComment ? ` “${b.ratingComment}”` : ""}</>}
            </p>
          )}
        </Card>
      </div>

      {b.pickup.lat != null && b.pickup.lng != null && (
        <section className="mt-6 rounded-xl border border-line bg-surface p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Route</div>
          <MapPicker
            readOnly
            height={280}
            pickup={{ text: b.pickup.text, lat: b.pickup.lat, lng: b.pickup.lng }}
            dropoff={
              b.dropoff.lat != null && b.dropoff.lng != null
                ? { text: b.dropoff.text, lat: b.dropoff.lat, lng: b.dropoff.lng }
                : null
            }
          />
        </section>
      )}

      {b.status === "NEW" && <AssignPanel bookingId={id} tier={b.tier} onDone={invalidate} />}
      {payable && <PaymentPanel bookingId={id} />}

      <Card title="History" className="mt-6">
        <ul className="space-y-1 text-sm">
          {b.statusHistory.map((h, i) => (
            <li key={i} className="text-muted">
              {h.fromStatus ? `${titleCase(h.fromStatus)} → ` : ""}
              <span className="text-ink">{titleCase(h.toStatus)}</span> ·{" "}
              {new Date(h.changedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function AssignPanel({
  bookingId,
  tier,
  onDone,
}: {
  bookingId: string;
  tier: VehicleTier;
  onDone: () => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const drivers = useQuery({
    queryKey: ["assignable-drivers", tier],
    queryFn: () => api.get<Paginated<DriverRow>>(`/drivers?status=VERIFIED&tier=${tier}&limit=100`),
  });
  const driver = useQuery({
    queryKey: ["driver", driverId],
    queryFn: () => api.get<DriverDetail>(`/drivers/${driverId}`),
    enabled: !!driverId,
  });

  const assign = useMutation({
    mutationFn: () => api.post(`/bookings/${bookingId}/assign`, { driverId, vehicleId }),
    onSuccess: onDone,
  });

  const vehicles = (driver.data?.vehicles ?? []).filter((v) => v.tier === tier && v.isActive);

  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink">Assign a driver</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Driver (verified, {tierLabel(tier)})</span>
          <select
            value={driverId}
            onChange={(e) => {
              setDriverId(e.target.value);
              setVehicleId("");
            }}
            className="rounded-lg border border-line px-2 py-2"
          >
            <option value="">Select…</option>
            {(drivers.data?.items ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.phone}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Vehicle</span>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={!driverId}
            className="rounded-lg border border-line px-2 py-2"
          >
            <option value="">Select…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => assign.mutate()}
          disabled={!driverId || !vehicleId || assign.isPending}
          className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
        >
          Assign
        </button>
      </div>
      {drivers.data && drivers.data.items.length === 0 && (
        <p className="mt-2 text-sm text-muted">No verified {tierLabel(tier)} drivers available.</p>
      )}
      {assign.error && <p className="mt-2 text-sm text-red-600">{(assign.error as Error).message}</p>}
    </section>
  );
}

function PaymentPanel({ bookingId }: { bookingId: string }) {
  const qc = useQueryClient();
  const [providerRef, setProviderRef] = useState("");
  const isAdmin = getStaff()?.role === "ADMIN";

  const payment = useQuery({
    queryKey: ["payment", bookingId],
    queryFn: () => api.get<PaymentView>(`/bookings/${bookingId}/payment`),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
    // While the customer is approving (or the simulator is counting down), watch it land.
    refetchInterval: (q) => (q.state.data?.status === "PENDING" ? 4000 : false),
  });

  // Admin only: the customer sent MoMo to the business number and it is on the statement.
  const record = useMutation({
    mutationFn: () => api.post(`/bookings/${bookingId}/payment`, { providerRef: providerRef.trim() }),
    onSuccess: () => {
      setProviderRef("");
      qc.invalidateQueries({ queryKey: ["payment", bookingId] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
    },
  });

  const notFound = payment.error instanceof ApiError && payment.error.status === 404;
  const p = payment.data;
  const canRecord = !p || p.status === "PENDING" || p.status === "FAILED";

  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink">Payment · MoMo</h2>
      {p ? (
        <div className="text-sm">
          <p>
            {money(p.amount)} · <StatusPill status={p.status} />
          </p>
          <p className="mt-1 text-xs text-muted">
            Commission {money(p.commissionAmount)} ({p.takeRatePct}%) · Driver {money(p.driverPayout)}
          </p>
          <p className="mt-1 font-mono text-xs text-muted">
            ref {p.reference}
            {p.providerRef && ` · MoMo ${p.providerRef}`}
          </p>
          {p.status === "PENDING" && (
            <p className="mt-1 text-xs text-muted">
              {p.simulated
                ? "Simulated MoMo (MTN sandbox pending): confirms itself in a few seconds, through the same webhook path."
                : "Waiting for the customer to approve the prompt. The trip is dispatched once the provider confirms."}
            </p>
          )}
          {p.simulated && p.status === "PAID" && <p className="mt-1 text-xs text-amber-700">Simulated payment — not real money.</p>}
          {p.status === "FAILED" && p.failureReason && (
            <p className="mt-1 text-xs text-red-600">{p.failureReason}</p>
          )}
          {p.status === "REFUNDED" && <p className="mt-1 text-xs text-muted">Refunded {p.refundedAt?.slice(0, 16).replace("T", " ")}</p>}
        </div>
      ) : notFound ? (
        <p className="text-sm text-muted">Not paid yet. The customer pays from the app; a driver is sent once the money is in.</p>
      ) : (
        <p className="text-sm text-muted">Loading…</p>
      )}

      {isAdmin && canRecord && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Record a transfer seen on the statement — MoMo transaction id</span>
            <input
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              placeholder="e.g. 8827364591"
              className="w-72 rounded-lg border border-line px-3 py-2 font-mono"
            />
          </label>
          <button
            onClick={() => record.mutate()}
            disabled={record.isPending || !providerRef.trim()}
            className="rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white hover:bg-blue disabled:opacity-60"
          >
            Record payment
          </button>
          {record.error && <p className="text-sm text-red-600">{(record.error as Error).message}</p>}
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: PaymentView["status"] }) {
  const cls =
    status === "PAID" ? "bg-green-50 text-green-700" :
    status === "PENDING" ? "bg-amber-50 text-amber-700" :
    status === "REFUNDED" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{titleCase(status)}</span>;
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 text-sm ${className}`}>
      <div className="mb-1 text-xs uppercase tracking-wide text-muted">{title}</div>
      {children}
    </div>
  );
}

