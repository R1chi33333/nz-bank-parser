export type {
  BankId,
  Direction,
  ParseOptions,
  ParseResult,
  RowError,
  RowErrorCode,
  Transaction,
} from './types.js';

/**
 * Banks whose CSV exports this library can parse.
 */
export const SUPPORTED_BANKS = ['anz', 'asb', 'westpac', 'kiwibank'] as const;
