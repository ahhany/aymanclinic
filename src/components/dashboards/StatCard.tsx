import { Card } from '../ui/card';

/** Big number + label — the dashboard stat tile. */
export function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className="p-3">
      <div className={`text-2xl font-bold ${accent ? 'text-clinic-red' : 'text-clinic-navy'}`}>{value}</div>
      <div className="mt-1 text-xs text-clinic-steel">{label}</div>
    </Card>
  );
}
