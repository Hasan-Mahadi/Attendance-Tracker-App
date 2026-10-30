'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin',
        className
      )}
    />
  );
}
