export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

// r chosen so the circumference is 100, making stroke-dasharray percentages direct.
const R = 15.9155;

/** Hand-rolled SVG donut (stroke-dasharray circle) with a legend. Null when total is 0. */
export function DonutChart({ data, centerText }: { data: DonutDatum[]; centerText?: string | number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return null;
  let offset = 25; // start at 12 o'clock
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-32 w-32 shrink-0" role="img">
        <circle cx={21} cy={21} r={R} fill="transparent" stroke="#e2e8f0" strokeWidth={6} />
        {data
          .filter((d) => d.value > 0)
          .map((d) => {
            const frac = (d.value / total) * 100;
            const el = (
              <circle
                key={d.label}
                cx={21}
                cy={21}
                r={R}
                fill="transparent"
                stroke={d.color}
                strokeWidth={6}
                strokeDasharray={`${frac} ${100 - frac}`}
                strokeDashoffset={offset}
              />
            );
            offset -= frac;
            return el;
          })}
        {centerText !== undefined && (
          <text x={21} y={22.5} textAnchor="middle" fontSize={7} fontWeight={700} fill="#17365d">
            {centerText}
          </text>
        )}
      </svg>
      <ul className="space-y-1 text-xs text-clinic-steel">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.label}</span>
            <span className="font-semibold text-clinic-navy">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
