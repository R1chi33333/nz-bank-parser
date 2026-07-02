/**
 * ASB FastNet Classic "CSV-Generic" statement export.
 *
 * The file starts with a metadata preamble (created date, account,
 * date range, balances) before the header row:
 * Date,Unique Id,Tran Type,Cheque Number,Payee,Memo,Amount
 * Dates are year-first (YYYY/MM/DD). Negative amounts are debits.
 * No running balance column. Format cross-checked against accounting
 * software import guides; ASB does not publish the spec directly.
 */

import { parseAmount, parseDate } from '../normalise.js';
import { fieldAt, joinParts, rowError, type BankAdapter } from './shared.js';

const HEADER = [
  'Date',
  'Unique Id',
  'Tran Type',
  'Cheque Number',
  'Payee',
  'Memo',
  'Amount',
] as const;

const COL = {
  date: 0,
  uniqueId: 1,
  tranType: 2,
  chequeNumber: 3,
  payee: 4,
  memo: 5,
  amount: 6,
} as const;

export const asb: BankAdapter = {
  id: 'asb',
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

    // Payee holds the merchant when present; card and machine
    // transactions sometimes carry the detail only in Memo.
    const payee = fieldAt(fields, COL.payee).trim();
    const memo = fieldAt(fields, COL.memo).trim();
    const description =
      payee !== ''
        ? joinParts(fieldAt(fields, COL.tranType), payee)
        : joinParts(fieldAt(fields, COL.tranType), memo);
    const reference =
      payee !== ''
        ? joinParts(fieldAt(fields, COL.chequeNumber), memo)
        : fieldAt(fields, COL.chequeNumber).trim();

    return {
      ok: true,
      transaction: {
        date,
        amount: amount.cents,
        direction: amount.negative ? 'debit' : 'credit',
        description,
        reference,
        raw,
      },
    };
  },
};
