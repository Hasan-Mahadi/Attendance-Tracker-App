import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format paisa amount to BDT currency string.
 * @param paisa - Amount in paisa (1 BDT = 100 paisa)
 * @returns Formatted string like "৳1,234.56"
 */
export function formatCurrency(paisa: number): string {
  const taka = paisa / 100;
  return `৳${taka.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date using date-fns.
 * @param date - Date string or Date object
 * @param formatStr - date-fns format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Format a date to time string.
 * @param date - Date string or Date object
 * @returns Formatted time string like "09:30 AM"
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'hh:mm a');
  } catch {
    return '—';
  }
}

/**
 * Format duration in minutes to human-readable string.
 * @param minutes - Duration in minutes
 * @returns Formatted string like "8h 30m"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 0) return '—';

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get initials from a full name.
 * @param name - Full name (e.g., "John Doe")
 * @returns Initials (e.g., "JD")
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Convert a UTC date to Asia/Dhaka local time.
 * @param utcDate - UTC date string or Date object
 * @returns Date adjusted to Asia/Dhaka timezone
 */
export function toLocalDate(utcDate: string | Date): Date {
  const d = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  // Asia/Dhaka is UTC+6
  const offset = 6 * 60; // minutes
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + offset * 60 * 1000);
}

/**
 * Format relative time from now.
 * @param date - Date string or Date object
 * @returns Relative time string like "2 hours ago"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

/**
 * Truncate a string to specified length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Sleep helper for async operations.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
