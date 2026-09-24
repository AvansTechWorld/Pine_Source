import React from "react";

/**
 * Plain SVG bar chart. No chart library — this app has exactly two charts
 * and neither needs one. `data` is [{ label, value }].
 */
export default function BarChart({ data, height = 96, ariaLabel = "Chart" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 20);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 20 - barHeight;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={Math.max(barHeight, d.value > 0 ? 2 : 0)}
              fill="#22C55E"
              rx="1"
            />
          );
        })}
      </svg>
      <div className="flex text-xs text-muted mt-1">
        {data.map((d, i) => (
          <div key={i} style={{ width: barWidth + "%" }} className="text-center truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
