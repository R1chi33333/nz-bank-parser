/**
 * Shared normalisation primitives used by every bank adapter.
 *
 * All functions return `undefined` for input they cannot interpret.
 * Callers turn that into a structured RowError; nothing here throws.
 */

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const max = month === 2 && isLeap ? 29 : (DAYS_IN_MONTH[month - 1] ?? 0);
  return day <= max;
}

function toIso(year: number, month: number, day: number): string | undefined {
  if (!isValidCalendarDate(year, month, day)) {
    return undefined;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(year)}-${mm}-${dd}`;
}

// Day first, as every NZ bank exports: 14/05/2026, 14-05-2026, 14.05.2026.
const DMY = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
// ISO order, sometimes used by Kiwibank exports: 2026-05-14, 2026/05/14.
const YMD = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/;
// Written month: 14 May 2026, 14 MAY 26.
const DAY_MONTH_NAME = /^(\d{1,2}) ([A-Za-z]{3,9}) (\d{2}|\d{4})$/;
// Two-digit year variant of day-first: 14/05/26.
const DMY_SHORT = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/;

function expandYear(twoDigit: number): number {
  // Bank exports only reach back a few decades; pivot at 70 keeps
  // 1970-2069 representable, matching common spreadsheet behaviour.
  return twoDigit >= 70 ? 1900 + twoDigit : 2000 + twoDigit;
}

/**
 * Normalise a date string from a bank CSV to an ISO 8601 calendar date.
 * Day-first formats are assumed for ambiguous numeric dates, matching
 * NZ conventions. Returns `undefined` when the text is not a real date.
 */
export function parseDate(input: string): string | undefined {
  const text = input.trim();
  if (text === '') {
    return undefined;
  }

  let match = DMY.exec(text);
  if (match) {
    return toIso(Number(match[3]), Number(match[2]), Number(match[1]));
  }

  match = YMD.exec(text);
  if (match) {
    return toIso(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  match = DMY_SHORT.exec(text);
  if (match) {
    return toIso(expandYear(Number(match[3])), Number(match[2]), Number(match[1]));
  }

  match = DAY_MONTH_NAME.exec(text);
  if (match) {
    const monthText = (match[2] ?? '').slice(0, 3).toLowerCase();
    const month = MONTHS[monthText];
    if (month === undefined) {
      return undefined;
    }
    const rawYear = Number(match[3]);
    const year = rawYear < 100 ? expandYear(rawYear) : rawYear;
    return toIso(year, month, Number(match[1]));
  }

  return undefined;
}

/** Sign and magnitude of a parsed amount. */
export interface ParsedAmount {
  /** Absolute value in cents. */
  cents: number;
  negative: boolean;
}

// Matches an optional currency symbol, thousands separators and up to
// two decimal places: 1,234.56 / 1234 / $12.50 / 0.05
const AMOUNT = /^\$?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parse a monetary amount into integer cents plus an explicit sign.
 * Accepts a leading minus, parenthesised negatives ("(12.50)"), a
 * currency symbol and thousands separators. Returns `undefined` for
 * anything that is not a plain decimal amount.
 */
export function parseAmount(input: string): ParsedAmount | undefined {
  let text = input.trim();
  if (text === '') {
    return undefined;
  }

  let negative = false;
  if (text.startsWith('(') && text.endsWith(')')) {
    negative = true;
    text = text.slice(1, -1).trim();
  }
  if (text.startsWith('-')) {
    negative = true;
    text = text.slice(1).trim();
  } else if (text.startsWith('+')) {
    text = text.slice(1).trim();
  }

  const match = AMOUNT.exec(text);
  if (!match) {
    return undefined;
  }

  const whole = Number((match[1] ?? '').replaceAll(',', ''));
  const decimals = match[2] ?? '';
  const cents = whole * 100 + Number(decimals.padEnd(2, '0') || '0');
  return { cents, negative: negative && cents !== 0 };
}
