import { adapters } from './adapters/index.js';
import { findHeaderRow, parseWithAdapter, type BankAdapter } from './adapters/shared.js';
import { tokenize, type CsvRow } from './csv.js';
import type { BankId, ParseOptions, ParseResult } from './types.js';

/**
 * Thrown when no bank format can be detected and none was specified.
 * This is the only error `parse` throws; bad rows inside a recognised
 * file are collected in `ParseResult.errors` instead.
 */
export class UnrecognisedFormatError extends Error {
  constructor() {
    super(
      'Could not detect the bank from the CSV header. ' +
        'Pass { bank: "anz" | "asb" | "westpac" | "kiwibank" } explicitly.',
    );
    this.name = 'UnrecognisedFormatError';
  }
}

function detectAdapter(rows: readonly CsvRow[]): BankAdapter | undefined {
  return Object.values(adapters).find((adapter) => findHeaderRow(rows, adapter.header) !== -1);
}

/**
 * Detect which bank a CSV export came from by its header fingerprint.
 * Returns `undefined` when no known header is found.
 */
export function detectBank(csvContent: string): BankId | undefined {
  return detectAdapter(tokenize(csvContent))?.id;
}

/**
 * Parse a New Zealand bank CSV export into normalised transactions.
 *
 * The bank is auto-detected from the header row unless `options.bank`
 * is given. Rows that cannot be parsed are collected in `errors`
 * while the rest of the file parses normally.
 *
 * @throws UnrecognisedFormatError when the bank cannot be detected
 *         and no explicit `bank` option was provided.
 */
export function parse(csvContent: string, options?: ParseOptions): ParseResult {
  const rows = tokenize(csvContent);
  const adapter = options?.bank !== undefined ? adapters[options.bank] : detectAdapter(rows);
  if (adapter === undefined) {
    throw new UnrecognisedFormatError();
  }
  const { transactions, errors } = parseWithAdapter(rows, adapter);
  return { bank: adapter.id, transactions, errors };
}
