import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectBank, parse, UnrecognisedFormatError } from '../src/index.js';
import type { BankId } from '../src/index.js';

function loadFixture(bank: string, name: string): string {
  return readFileSync(join(import.meta.dirname, 'fixtures', bank, name), 'utf8');
}

const FIXTURES: [BankId, number][] = [
  ['anz', 5],
  ['asb', 5],
  ['westpac', 5],
  ['kiwibank', 4],
];

describe('detectBank', () => {
  it.each(FIXTURES)('detects %s from its header fingerprint', (bank) => {
    expect(detectBank(loadFixture(bank, 'standard.csv'))).toBe(bank);
  });

  it('detects headers below a metadata preamble', () => {
    expect(detectBank(loadFixture('asb', 'standard.csv'))).toBe('asb');
  });

  it('returns undefined for unknown formats', () => {
    expect(detectBank('Foo,Bar\n1,2\n')).toBeUndefined();
    expect(detectBank('')).toBeUndefined();
  });
});

describe('parse', () => {
  it.each(FIXTURES)('parses a %s export end to end', (bank, count) => {
    const result = parse(loadFixture(bank, 'standard.csv'));
    expect(result.bank).toBe(bank);
    expect(result.errors).toEqual([]);
    expect(result.transactions).toHaveLength(count);
    for (const tx of result.transactions) {
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isInteger(tx.amount)).toBe(true);
      expect(tx.amount).toBeGreaterThanOrEqual(0);
    }
  });

  it('respects an explicit bank option over detection', () => {
    const csv = 'Visa Purchase,SHOP,,,,-1.00,01/05/2026,,\n';
    const result = parse(csv, { bank: 'anz' });
    expect(result.bank).toBe('anz');
    expect(result.transactions).toHaveLength(1);
  });

  it('throws UnrecognisedFormatError for unknown formats', () => {
    expect(() => parse('Foo,Bar\n1,2\n')).toThrow(UnrecognisedFormatError);
    expect(() => parse('Foo,Bar\n1,2\n')).toThrow(/Pass \{ bank:/);
  });

  it('strips a BOM before detection', () => {
    const withBom = '﻿' + loadFixture('westpac', 'standard.csv');
    expect(parse(withBom).bank).toBe('westpac');
  });
});
