/**
 * Identifiers for the supported New Zealand banks.
 */
export type BankId = 'anz' | 'asb' | 'westpac' | 'kiwibank';

/**
 * Direction of money movement relative to the account the CSV was exported from.
 */
export type Direction = 'debit' | 'credit';

/**
 * A single transaction normalised into the common model.
 */
export interface Transaction {
  /** Transaction date as an ISO 8601 calendar date, e.g. "2026-05-14". */
  date: string;
  /** Absolute amount in cents. Sign is carried by `direction`. */
  amount: number;
  /** Whether money left (debit) or entered (credit) the account. */
  direction: Direction;
  /** Human-readable description, merged from the bank's description columns. */
  description: string;
  /** Bank reference / particulars / code fields, joined when present. */
  reference: string;
  /** Running balance in cents, when the bank includes it. */
  balance?: number;
  /** The original, untouched CSV row this transaction was parsed from. */
  raw: Record<string, string>;
}

/**
 * A row that could not be parsed. Parsing never throws for bad rows;
 * they are collected here while the rest of the file parses normally.
 */
export interface RowError {
  /** 1-based line number in the original file, including the header line. */
  line: number;
  /** Machine-readable reason code. */
  code: RowErrorCode;
  /** Human-readable explanation of what went wrong. */
  message: string;
  /** The raw text of the offending line. */
  rawLine: string;
}

export type RowErrorCode = 'invalid-date' | 'invalid-amount' | 'column-mismatch' | 'empty-row';

/**
 * Options accepted by `parse`.
 */
export interface ParseOptions {
  /**
   * Skip auto-detection and parse as this bank's format.
   */
  bank?: BankId;
}

/**
 * Result of parsing a CSV export.
 */
export interface ParseResult {
  /** The bank whose format was detected or specified. */
  bank: BankId;
  /** Successfully parsed transactions, in file order. */
  transactions: Transaction[];
  /** Rows that failed to parse. Empty when the whole file parsed cleanly. */
  errors: RowError[];
}
