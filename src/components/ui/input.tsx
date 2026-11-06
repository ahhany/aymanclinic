import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-clinic-line bg-white px-3 text-sm outline-none',
        'placeholder:text-slate-400 focus:border-clinic-blue focus:ring-2 focus:ring-clinic-blue/20',
        className,
      )}
      {...props}
    />
  );
}
