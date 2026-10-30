'use client';

import React from 'react';
import { cn, getInitials } from '../../lib/utils';

export function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  }[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover shrink-0', sizeClasses, className)}
      />
    );
  }

  const initials = getInitials(name || 'User');

  return (
    <div
      className={cn(
        'rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center shrink-0 border border-blue-200 select-none',
        sizeClasses,
        className
      )}
    >
      {initials}
    </div>
  );
}
