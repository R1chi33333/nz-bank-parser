/**
 * Helpers shared by all bank adapters.
 */

import type { CsvRow } from '../csv.js';
import type { BankId, RowError, Transaction } from '../types.js';

/** How one bank's CSV export maps onto the common transaction model. */
export interface BankAdapter {
  id: BankId;
  /** Exact header row of this bank's export, used for detection. */
  header: readonly string[];
  /** Convert one data row into a transaction, or a row error. */
  mapRow(
    fields: readonly string[],
    line: number,
    raw: Record<string, string>,
  ): { ok: true; transaction: Transaction } | { ok: false; error: RowError };
}

/** Case-insensitive comparison of a tokenized row against an expected header. */
export function matchesHeader(fields: readonly string[], header: readonly string[]): boolean {
  if (fields.length !== header.length) {
    return false;
  }
  return header.every((name, i) => (fields[i] ?? '').trim().toLowerCase() === name.toLowerCase());
}

/** Locate the header row, skipping any metadata preamble above it. */
export function findHeaderRow(rows: readonly CsvRow[], header: readonly string[]): number {
  return rows.findIndex((row) => matchesHeader(row.fields, header));
}

/**
 * Access a field that header-length validation has already guaranteed
 * exists. Throwing here would indicate a bug in parseWithAdapter, not
 * bad user input.
 */
export function fieldAt(fields: readonly string[], index: number): string {
  const value = fields[index];
  if (value === undefined) {
    throw new Error(`Field index ${String(index)} out of validated range`);
  }
  return value;
}

/** Join reference-like fields, dropping empties. */
export function joinParts(...parts: readonly string[]): string {
  return parts
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join(' ');
}

/** Build the `raw` record preserving the bank's own column names. */
export function buildRaw(
  header: readonly string[],
  fields: readonly string[],
): Record<string, string> {
  const raw: Record<string, string> = {};
  header.forEach((name, i) => {
    raw[name] = fields[i] ?? '';
  });
  return raw;
}

export function rowError(
  line: number,
  code: RowError['code'],
  message: string,
  rawLine: string,
): RowError {
  return { line, code, message, rawLine };
}

/**
 * Run an adapter over tokenized rows: find the header, skip the preamble,
 * map every data row, and collect errors without aborting the file.
 */
export function parseWithAdapter(
  rows: readonly CsvRow[],
  adapter: BankAdapter,
): { transactions: Transaction[]; errors: RowError[] } {
  const transactions: Transaction[] = [];
  const errors: RowError[] = [];

  const headerIndex = findHeaderRow(rows, adapter.header);
  const dataRows = headerIndex === -1 ? rows : rows.slice(headerIndex + 1);

  for (const row of dataRows) {
    if (row.fields.every((field) => field.trim() === '')) {
      continue;
    }
    if (row.fields.length !== adapter.header.length) {
      errors.push(
        rowError(
          row.line,
          'column-mismatch',
          `Expected ${String(adapter.header.length)} columns, got ${String(row.fields.length)}`,
          row.fields.join(','),
        ),
      );
      continue;
    }
    const raw = buildRaw(adapter.header, row.fields);
    const result = adapter.mapRow(row.fields, row.line, raw);
    if (result.ok) {
      transactions.push(result.transaction);
    } else {
      errors.push(result.error);
    }
  }

  return { transactions, errors };
}
