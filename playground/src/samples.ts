import type { BankId } from 'nz-bank-parser';
import anz from '../../tests/fixtures/anz/standard.csv?raw';
import asb from '../../tests/fixtures/asb/standard.csv?raw';
import kiwibank from '../../tests/fixtures/kiwibank/standard.csv?raw';
import westpac from '../../tests/fixtures/westpac/standard.csv?raw';

/**
 * Synthetic sample exports, shared with the library's test fixtures
 * so the playground always demonstrates exactly what the tests cover.
 */
export const SAMPLES: Record<BankId, string> = { anz, asb, westpac, kiwibank };

export const BANK_LABELS: Record<BankId, string> = {
  anz: 'ANZ',
  asb: 'ASB',
  westpac: 'Westpac',
  kiwibank: 'Kiwibank',
};
