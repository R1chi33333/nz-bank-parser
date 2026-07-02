import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseWithAdapter } from '../../src/adapters/shared.js';
import { westpac } from '../../src/adapters/westpac.js';
import { tokenize } from '../../src/csv.js';

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, '..', 'fixtures', 'westpac', name), 'utf8');
}

describe('westpac adapter', () => {
  it('parses a standard export', () => {
    const { transactions, errors } = parseWithAdapter(
      tokenize(loadFixture('standard.csv')),
      westpac,
    );

    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(5);

    expect(transactions[1]).toEqual({
      date: '2026-05-15',
      amount: 28000,
      direction: 'debit',
      description: 'J SMITH AUTOMATIC PAYMENT',
      reference: 'RENT FLAT 2B AP0012',
      raw: expect.objectContaining({
        'Other Party': 'J SMITH',
        'Analysis Code': 'AP0012',
      }) as Record<string, string>,
    });

    const salary = transactions[2];
    expect(salary?.direction).toBe('credit');
    expect(salary?.amount).toBe(185000);

    const fee = transactions[4];
    expect(fee?.description).toBe('BANK FEE');
    expect(fee?.reference).toBe('MONTHLY');
  });

  it('handles quoted commas in the other party field', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('standard.csv')), westpac);
    expect(transactions[3]?.description).toBe('HARVEY, NORMAN VISA PURCHASE');
  });

  it('collects errors and parses parenthesised debits', () => {
    const { transactions, errors } = parseWithAdapter(
      tokenize(loadFixture('edge-cases.csv')),
      westpac,
    );

    expect(errors.map((e) => e.code)).toEqual([
      'invalid-date',
      'invalid-amount',
      'column-mismatch',
    ]);
    expect(errors.map((e) => e.line)).toEqual([2, 3, 4]);

    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      date: '2026-05-22',
      amount: 1575,
      direction: 'debit',
    });
  });
});
