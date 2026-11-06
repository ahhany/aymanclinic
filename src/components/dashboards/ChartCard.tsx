import type { ReactNode } from 'react';
import { Card } from '../ui/card';

/** Card with the paper-file section header (navy bar, red rule) wrapping a chart. */
export function ChartCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-sm font-semibold text-white">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}
