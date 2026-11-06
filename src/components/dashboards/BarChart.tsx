export interface BarDatum {
  label: string;
  value: number;
}

/** Hand-rolled SVG vertical bar chart (no chart library). Returns null when empty. */
export function BarChart({ data, height = 140 }: { data: BarDatum[]; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = 60;
  const barWidth = 36;
  return (
    <svg viewBox={`0 0 ${data.length * slot} ${height + 24}`} className="w-full" role="img">
      {data.map((d, i) => {
        const barH = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * (height - 24));
        const x = i * slot + (slot - barWidth) / 2;
        const y = height - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={barH} fill="#1f497d" rx={2} />
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="#244061">
              {d.value}
            </text>
            <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" fontSize={9} fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={height} x2={data.length * slot} y2={height} stroke="#d8dee9" strokeWidth={1} />
    </svg>
  );
}
