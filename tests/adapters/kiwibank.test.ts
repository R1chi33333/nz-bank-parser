import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { kiwibank } from '../../src/adapters/kiwibank.js';
import { parseWithAdapter } from '../../src/adapters/shared.js';
import { tokenize } from '../../src/csv.js';

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, '..', 'fixtures', 'kiwibank', name), 'utf8');
}

describe('kiwibank adapter', () => {
  it('parses a standard export with balances', () => {
    const { transactions, errors } = parseWithAdapter(
      tokenize(loadFixture('standard.csv')),
      kiwibank,
    );

    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(4);

    expect(transactions[0]).toMatchObject({
      date: '2026-05-14',
      amount: 6420,
      direction: 'debit',
      description: 'POS W/D NEW WORLD WELLINGTON',
      balance: 120155,
    });

    const rent = transactions[1];
    expect(rent?.description).toBe('AP RENT J SMITH');
    expect(rent?.reference).toBe('LANDLORD MAY RENT');
    expect(rent?.balance).toBe(92155);
  });

  it('derives direction from the credit column for incoming payments', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('standard.csv')), kiwibank);
    const salary = transactions[2];
    expect(salary?.direction).toBe('credit');
    expect(salary?.amount).toBe(185000);
    expect(salary?.balance).toBe(277155);
  });

  it('collects row errors and keeps parsing', () => {
    const { transactions, errors } = parseWithAdapter(
      tokenize(loadFixture('edge-cases.csv')),
      kiwibank,
    );

    expect(errors.map((e) => e.code)).toEqual(['invalid-date', 'invalid-amount']);
    expect(transactions).toHaveLength(2);
  });

  it('omits balance when the column is empty and keeps negative balances signed', () => {
    const { transactions } = parseWithAdapter(tokenize(loadFixture('edge-cases.csv')), kiwibank);

    const noBalance = transactions[0];
    expect(noBalance?.balance).toBeUndefined();
    expect('balance' in (noBalance ?? {})).toBe(false);

    const overdrawn = transactions[1];
    expect(overdrawn?.balance).toBe(-2540);
  });
});
