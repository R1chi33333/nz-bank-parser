/**
 * Westpac NZ online banking CSV export.
 *
 * Header: Date,Amount,Other Party,Description,Reference,Particulars,Analysis Code
 * Dates are day-first (DD/MM/YYYY). Negative amounts are debits.
 * No running balance column.
 */

import { parseAmount, parseDate } from '../normalise.js';
import { fieldAt, joinParts, rowError, type BankAdapter } from './shared.js';

const HEADER = [
  'Date',
  'Amount',
  'Other Party',
  'Description',
  'Reference',
  'Particulars',
  'Analysis Code',
] as const;

const COL = {
  date: 0,
  amount: 1,
  otherParty: 2,
  description: 3,
  reference: 4,
  particulars: 5,
  analysisCode: 6,
} as const;

export const westpac: BankAdapter = {
  id: 'westpac',
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
        description: joinParts(fieldAt(fields, COL.otherParty), fieldAt(fields, COL.description)),
        reference: joinParts(
          fieldAt(fields, COL.reference),
          fieldAt(fields, COL.particulars),
          fieldAt(fields, COL.analysisCode),
        ),
        raw,
      },
    };
  },
};
