'use client';

import { Ghost } from 'lucide-react';

type Size = 'sm' | 'md' | 'lg';

const iconSizes: Record<Size, string> = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

const textSizes: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

const gaps: Record<Size, string> = {
  sm: 'gap-2',
  md: 'gap-2',
  lg: 'gap-3',
};

interface NoImageFallbackProps {
  size?: Size;
  /** true (default) = absolute inset-0, false = w-full h-full (for slider slides) */
  fill?: boolean;
}

export default function NoImageFallback({ size = 'md', fill = true }: NoImageFallbackProps) {
  const container = fill ? 'absolute inset-0' : 'w-full h-full';
  return (
    <div className={`${container} flex flex-col items-center justify-center ${gaps[size]} bg-[rgb(25,25,33)]`}>
      <Ghost className={`${iconSizes[size]} text-muted-foreground/40`} />
      <span className={`${textSizes[size]} text-muted-foreground/70`}>No hay imagen ;(</span>
    </div>
  );
}
