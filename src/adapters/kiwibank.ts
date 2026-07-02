/**
 * Kiwibank internet banking full CSV export.
 *
 * Header:
 * Account number,Date,Memo/Description,Source Code (payment type),
 * TP ref,TP part,TP code,OP ref,OP part,OP code,OP name,
 * OP Bank Account Number,Amount (credit),Amount (debit),Amount,Balance
 *
 * Dates are day-first. The signed Amount column always carries the
 * value; the credit and debit columns are populated one at a time and
 * are used to derive direction when present. Balance is included.
 * Kiwibank does not publish this spec; the layout follows accounting
 * import guides, so detection failures should fall back to an explicit
 * bank option.
 */

import { parseAmount, parseDate } from '../normalise.js';
import { fieldAt, joinParts, rowError, type BankAdapter } from './shared.js';
import type { Direction, Transaction } from '../types.js';

const HEADER = [
  'Account number',
  'Date',
  'Memo/Description',
  'Source Code (payment type)',
  'TP ref',
  'TP part',
  'TP code',
  'OP ref',
  'OP part',
  'OP code',
  'OP name',
  'OP Bank Account Number',
  'Amount (credit)',
  'Amount (debit)',
  'Amount',
  'Balance',
] as const;

const COL = {
  date: 1,
  memo: 2,
  sourceCode: 3,
  tpRef: 4,
  tpPart: 5,
  tpCode: 6,
  opRef: 7,
  opPart: 8,
  opCode: 9,
  opName: 10,
  credit: 12,
  debit: 13,
  amount: 14,
  balance: 15,
} as const;

function deriveDirection(fields: readonly string[], amountNegative: boolean): Direction {
  if (fieldAt(fields, COL.debit).trim() !== '') {
    return 'debit';
  }
  if (fieldAt(fields, COL.credit).trim() !== '') {
    return 'credit';
  }
  return amountNegative ? 'debit' : 'credit';
}

export const kiwibank: BankAdapter = {
  id: 'kiwibank',
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

    const transaction: Transaction = {
      date,
      amount: amount.cents,
      direction: deriveDirection(fields, amount.negative),
      description: joinParts(fieldAt(fields, COL.memo), fieldAt(fields, COL.opName)),
      reference: joinParts(
        fieldAt(fields, COL.opRef),
        fieldAt(fields, COL.opPart),
        fieldAt(fields, COL.opCode),
      ),
      raw,
    };

    const balance = parseAmount(fieldAt(fields, COL.balance));
    if (balance !== undefined) {
      transaction.balance = balance.negative ? -balance.cents : balance.cents;
    }

    return { ok: true, transaction };
  },
};
