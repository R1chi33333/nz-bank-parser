/**
 * ANZ New Zealand transaction history export.
 *
 * Header confirmed against ANZ's Internet Banking CSV export:
 * Type,Details,Particulars,Code,Reference,Amount,Date,ForeignCurrencyAmount,ConversionCharge
 * Dates are day-first (DD/MM/YYYY). Negative amounts are debits.
 * The export carries no running balance column.
 */

import { parseAmount, parseDate } from '../normalise.js';
import { fieldAt, joinParts, rowError, type BankAdapter } from './shared.js';

const HEADER = [
  'Type',
  'Details',
  'Particulars',
  'Code',
  'Reference',
  'Amount',
  'Date',
  'ForeignCurrencyAmount',
  'ConversionCharge',
] as const;

const COL = {
  type: 0,
  details: 1,
  particulars: 2,
  code: 3,
  reference: 4,
  amount: 5,
  date: 6,
} as const;

export const anz: BankAdapter = {
  id: 'anz',
  header: HEADER,
  mapRow(fields, line, raw) {
    const rawLine = fields.join(',');

    const date = parseDate(fieldAt(fields, COL.date));
    if (date === undefined) {
      return {
        ok: false,
        error: rowError(
          line,
          'invalid-date',
          `Unrecognised date "${fieldAt(fields, COL.date)}"`,
          rawLine,
        ),
      };
    }

    const amount = parseAmount(fieldAt(fields, COL.amount));
    if (amount === undefined) {
      return {
        ok: false,
        error: rowError(
          line,
          'invalid-amount',
          `Unrecognised amount "${fieldAt(fields, COL.amount)}"`,
          rawLine,
        ),
      };
    }

    return {
      ok: true,
      transaction: {
        date,
        amount: amount.cents,
        direction: amount.negative ? 'debit' : 'credit',
        description: joinParts(fieldAt(fields, COL.type), fieldAt(fields, COL.details)),
        reference: joinParts(
          fieldAt(fields, COL.particulars),
          fieldAt(fields, COL.code),
          fieldAt(fields, COL.reference),
        ),
        raw,
      },
    };
  },
};
