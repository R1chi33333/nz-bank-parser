import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { asb } from '../../src/adapters/asb.js';
import { parseWithAdapter } from '../../src/adapters/shared.js';
import { tokenize } from '../../src/csv.js';

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, '..', 'fixtures', 'asb', name), 'utf8');
}

describe('asb adapter', () => {
  it('skips the FastNet metadata preamble and parses all rows', () => {
    const { transactions, errors } = parseWithAdapter(tokenize(loadFixture('standard.csv')), asb);

    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(5);

    expect(transactions[0]).toEqual({
      date: '2026-06-01',
      amount: 185000,
      direction: 'credit',
      description: 'DC ACME PAYROLL LTD',
      reference: 'SALARY JUNE',
      raw: expect.objectContaining({
        Date: '2026/06/01',
        'Unique Id': '2026060101',
        Payee: 'ACME PAYROLL LTD',
      }) as Record<string, string>,
    });
  });

  it('falls back to Memo for description when Payee is empty', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('standard.csv')), asb);
    const transfer = transactions[2];
    expect(transfer?.description).toBe('TFR OUT MB TRANSFER TO SAVINGS');
    expect(transfer?.reference).toBe('');
  });

  it('keeps cheque numbers in the reference', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('standard.csv')), asb);
    const cheque = transactions[3];
    expect(cheque?.description).toBe('CHQ CHEQUE DEPOSIT');
    expect(cheque?.reference).toBe('000042');
  });

  it('handles quoted commas in payee names', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('standard.csv')), asb);
    expect(transactions[4]?.description).toBe('DD MERIDIAN, ENERGY');
  });

  it('collects errors per row and keeps parsing', () => {
    const { transactions, errors } = parseWithAdapter(tokenize(loadFixture('edge-cases.csv')), asb);

    expect(errors.map((e) => e.code)).toEqual([
      'invalid-amount',
      'column-mismatch',
      'invalid-date',
    ]);
    expect(errors[0]?.line).toBe(8);

    // Day-first dates are tolerated even though ASB exports year-first.
    expect(transactions.map((t) => t.date)).toEqual(['2026-06-13', '2026-06-14']);
  });
});
