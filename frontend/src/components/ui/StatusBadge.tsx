'use client';

import React from 'react';
import { Badge } from './Badge';

export function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase().replace(/-/g, '_');

  const config: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' }
  > = {
    // Attendance
    present: { label: 'Present', variant: 'success' },
    late: { label: 'Late', variant: 'warning' },
    half_day: { label: 'Half Day', variant: 'warning' },
    absent: { label: 'Absent', variant: 'danger' },
    on_leave: { label: 'On Leave', variant: 'info' },
    holiday: { label: 'Holiday', variant: 'primary' },
    weekly_off: { label: 'Weekly Off', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'info' },
    incomplete: { label: 'Incomplete', variant: 'danger' },
    early_departure: { label: 'Early Departure', variant: 'warning' },

    // Leave
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'default' },

    // Payroll
    draft: { label: 'Draft', variant: 'default' },
    processing: { label: 'Processing', variant: 'info' },
    finalized: { label: 'Finalized', variant: 'success' },

    // Employee status
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'danger' },
    terminated: { label: 'Terminated', variant: 'danger' },
    on_notice: { label: 'On Notice', variant: 'warning' },
  };

  const item = config[normalized] || {
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    variant: 'default',
  };

  return (
    <Badge variant={item.variant} dot>
      {item.label}
    </Badge>
  );
}
