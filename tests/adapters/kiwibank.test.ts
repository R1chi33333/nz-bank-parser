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

  it('falls back to the amount sign when credit and debit columns are empty', () => {
    const header =
      'Account number,Date,Memo/Description,Source Code (payment type),TP ref,TP part,TP code,OP ref,OP part,OP code,OP name,OP Bank Account Number,Amount (credit),Amount (debit),Amount,Balance';
    const csv = `${header}\n38-9000-0123456-00,21-05-2026,SIGN ONLY OUT,EFTPOS,,,,,,,,,,,-9.90,90.10\n38-9000-0123456-00,22-05-2026,SIGN ONLY IN,DC,,,,,,,,,,,9.90,100.00\n`;
    const { transactions, errors } = parseWithAdapter(tokenize(csv), kiwibank);

    expect(errors).toEqual([]);
    expect(transactions[0]?.direction).toBe('debit');
    expect(transactions[1]?.direction).toBe('credit');
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
