import { useEffect, useState } from "react";

export interface DonutDatum {
  label: string;
  value: number;
}

interface Props {
  title: string;
  data: DonutDatum[];
  format?: (n: number) => string;
  centerLabel?: string;
  emptyText?: string;
}

export const DONUT_COLORS = [
  "#1f5c54",
  "#d9b26f",
  "#6aa08f",
  "#c4704f",
  "#a9c4bb",
];

const R = 52;
const C = 2 * Math.PI * R;
const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function DonutChart({
  title,
  data,
  format = (n) => String(n),
  centerLabel = "Total",
  emptyText = "No data yet",
}: Props) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const items = data.filter((d) => d.value > 0);
  const total = items.reduce((s, d) => s + d.value, 0);
  const gap = items.length > 1 ? 2 : 0;

  let offset = 0;
  const segments = items.map((d, i) => {
    const len = (d.value / total) * C;
    const seg = {
      ...d,
      offset,
      draw: Math.max(0, len - gap),
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      pct: Math.round((d.value / total) * 100),
    };
    offset += len;
    return seg;
  });

  return (
    <section className="rsv-panel">
      <h4 className="rsv-panel-title">{title}</h4>
      <div className="rsv-donut">
        <div className="rsv-donut-figure">
          <svg
            viewBox="0 0 140 140"
            className="rsv-donut-svg"
            role="img"
            aria-label={title}
          >
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r={R} className="rsv-donut-track" />
              {segments.map((s, i) => (
                <circle
                  key={s.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === i ? 18 : 14}
                  strokeDasharray={`${ready ? s.draw : 0} ${C}`}
                  strokeDashoffset={-s.offset}
                  style={{
                    transition: `stroke-dasharray 1s cubic-bezier(.22,1,.36,1) ${i * 0.12}s, stroke-width .2s, opacity .2s`,
                    opacity: active === null || active === i ? 1 : 0.35,
                  }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </g>
          </svg>
          <div className="rsv-donut-center">
            <strong>{total > 0 ? compact.format(total) : "—"}</strong>
            <span>{centerLabel}</span>
          </div>
        </div>

        {segments.length > 0 ? (
          <ul className="rsv-legend">
            {segments.map((s, i) => (
              <li
                key={s.label}
                className={active === i ? "active" : ""}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <i style={{ background: s.color }} />
                <span className="rsv-legend-label">{s.label}</span>
                <span className="rsv-legend-val">
                  {format(s.value)}
                  <em>{s.pct}%</em>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rsv-legend-empty">{emptyText}</p>
        )}
      </div>
    </section>
  );
}
