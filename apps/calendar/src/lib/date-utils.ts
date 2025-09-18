/**
 * Date utilities for consistent date/time handling
 */

/**
 * Ensures a value is in ISO string format
 * @param value - Date object or string
 * @returns ISO string
 */
export function ensureIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  // If it's already a string, validate and normalize it
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date.toISOString();
}

/**
 * Converts a date value to Date object
 * @param value - Date object or string
 * @returns Date object
 */
export function ensureDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}
