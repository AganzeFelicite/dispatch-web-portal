"use client";

import { useState } from "react";

export interface Column {
  label: string;
  value: number;
  /** Shown in the tooltip; defaults to the formatted value. */
  detail?: string;
}

/**
 * Single-series column chart in plain SVG: thin columns, rounded data-end, square baseline, one
 * data hue (#2f63d6, validated), text in ink tokens, hover tooltip, clean y ticks. No chart library.
 */
export function Columns({
  data,
  format = (v) => v.toLocaleString(),
  height = 180,
}: {
  data: Column[];
  format?: (v: number) => string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted">No data in this range.</p>;

  const width = 640;
  const pad = { top: 12, right: 8, bottom: 26, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const slot = plotW / data.length;
  const bar = Math.min(24, slot - 2);
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Column chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#64748b">
              {t.toLocaleString()}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + (slot - bar) / 2;
          const h = Math.max(0, pad.top + plotH - y(d.value));
          const r = Math.min(4, h);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${pad.top + plotH} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r} h${bar - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`}
                  fill="#2f63d6"
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + bar / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#64748b">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-md"
          style={{ left: `${((pad.left + hover * slot + slot / 2) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <div className="text-muted">{data[hover].label}</div>
          <div className="font-semibold text-ink">{data[hover].detail ?? format(data[hover].value)}</div>
        </div>
      )}
    </div>
  );
}

/** Bars for a handful of categories (e.g. spend by vehicle): label, thin bar, value at the tip. */
export function Bars({ data, format = (v) => v.toLocaleString() }: { data: Column[]; format?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted">No data in this range.</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink">{d.label}</span>
          <span className="h-3 overflow-hidden rounded-r bg-canvas" title={d.detail ?? format(d.value)}>
            <span className="block h-full rounded-r bg-[#2f63d6]" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-ink">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function niceStep(max: number): number {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * mag;
}
