import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { anz } from '../../src/adapters/anz.js';
import { parseWithAdapter } from '../../src/adapters/shared.js';
import { tokenize } from '../../src/csv.js';

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, '..', 'fixtures', 'anz', name), 'utf8');
}

describe('anz adapter', () => {
  it('parses a standard export', () => {
    const { transactions, errors } = parseWithAdapter(tokenize(loadFixture('standard.csv')), anz);

    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(5);

    expect(transactions[0]).toEqual({
      date: '2026-05-14',
      amount: 4567,
      direction: 'debit',
      description: 'Visa Purchase COUNTDOWN AUCKLAND',
      reference: '4835-****-1234',
      raw: expect.objectContaining({
        Type: 'Visa Purchase',
        Details: 'COUNTDOWN AUCKLAND',
        Amount: '-45.67',
        Date: '14/05/2026',
      }) as Record<string, string>,
    });

    const salary = transactions[2];
    expect(salary?.direction).toBe('credit');
    expect(salary?.amount).toBe(185000);
    expect(salary?.reference).toBe('SALARY MAY-26');

    const eftpos = transactions[3];
    expect(eftpos?.description).toBe('Eft-Pos BUNNINGS, MT WELLINGTON');
  });

  it('collects row errors without dropping good rows', () => {
    const { transactions, errors } = parseWithAdapter(tokenize(loadFixture('edge-cases.csv')), anz);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.description).toBe('Visa Purchase SAY "KIA ORA" CAFE');
    expect(transactions[1]?.direction).toBe('debit');
    expect(transactions[1]?.amount).toBe(2345);

    expect(errors).toHaveLength(3);
    expect(errors.map((e) => e.code)).toEqual([
      'invalid-amount',
      'invalid-date',
      'column-mismatch',
    ]);
    expect(errors[0]?.line).toBe(3);
    expect(errors[1]?.message).toContain('31/02/2026');
  });

  it('skips rows of empty fields silently', () => {
    const { errors } = parseWithAdapter(tokenize(loadFixture('edge-cases.csv')), anz);
    expect(errors.every((e) => e.code !== 'empty-row')).toBe(true);
  });

  it('parses data rows even when the header is missing', () => {
    const csv = 'Visa Purchase,SHOP,,,,-1.00,01/05/2026,,\n';
    const { transactions, errors } = parseWithAdapter(tokenize(csv), anz);
    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(1);
  });
});
