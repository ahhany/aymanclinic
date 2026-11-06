export interface HBarDatum {
  label: string;
  value: number;
}

/** Horizontal bar list for ranked data (top medications, diagnoses, indications). */
export function HBarList({ data, emptyText }: { data: HBarDatum[]; emptyText: string }) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">{emptyText}</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-sm">
          <div className="w-44 shrink-0 truncate text-clinic-steel" title={d.label}>
            {d.label}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="h-3 rounded-sm bg-clinic-blue"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
          <div className="w-8 shrink-0 text-end font-semibold text-clinic-navy">{d.value}</div>
        </div>
      ))}
    </div>
  );
}
