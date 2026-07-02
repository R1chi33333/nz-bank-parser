import type { BankId } from '../types.js';
import { anz } from './anz.js';
import { asb } from './asb.js';
import { kiwibank } from './kiwibank.js';
import { westpac } from './westpac.js';
import type { BankAdapter } from './shared.js';

export const adapters: Record<BankId, BankAdapter> = {
  anz,
  asb,
  westpac,
  kiwibank,
};
