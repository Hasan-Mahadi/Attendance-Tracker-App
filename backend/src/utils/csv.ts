/**
 * CSV generation utilities with formula injection prevention.
 */

/**
 * Sanitize a CSV cell value to prevent formula injection.
 * Prefixes values starting with =, +, -, or @ with a single quote.
 * @param value - The raw cell value
 * @returns Sanitized cell value safe for CSV
 */
export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Prevent formula injection by prefixing dangerous characters
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }

  // Escape double quotes and wrap in quotes if value contains comma, newline, or quotes
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Header definition for CSV generation.
 */
export interface CsvHeader {
  key: string;
  label: string;
}

/**
 * Generate a CSV string from headers and row data.
 * @param headers - Array of header definitions with key and label
 * @param rows - Array of row objects
 * @returns CSV formatted string with BOM for Excel compatibility
 */
export function generateCsv(
  headers: CsvHeader[],
  rows: Record<string, unknown>[]
): string {
  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';

  // Header row
  const headerLine = headers
    .map((h) => sanitizeCsvValue(h.label))
    .join(',');

  // Data rows
  const dataLines = rows.map((row) =>
    headers
      .map((h) => sanitizeCsvValue(row[h.key]))
      .join(',')
  );

  return BOM + [headerLine, ...dataLines].join('\r\n');
}
