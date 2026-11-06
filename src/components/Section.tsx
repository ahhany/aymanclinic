// Bilingual collapsible section — the "hybrid layout" building block (D2):
// paper section order & colours, rendered as interactive collapsible blocks.

import { useState, type ReactNode } from 'react';
import { SECTIONS, type SectionKey } from '../i18n/sections';
import { cn } from '../lib/utils';

export function Section({
  section,
  defaultOpen = false,
  children,
  className,
}: {
  section: SectionKey;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [en, ar] = SECTIONS[section];
  return (
    <div className={cn('overflow-hidden rounded-md border border-clinic-line bg-white', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="section-header w-full cursor-pointer text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold tracking-wide">
          {en}
          <span className="mx-2 text-white/40">·</span>
          <span className="font-normal">{ar}</span>
        </span>
        <span className="text-white/70" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}
