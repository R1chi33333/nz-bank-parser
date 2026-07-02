import { describe, expect, it } from 'vitest';
import { parseAmount, parseDate } from '../src/normalise.js';

describe('parseDate', () => {
  it('parses day-first numeric dates with various separators', () => {
    expect(parseDate('14/05/2026')).toBe('2026-05-14');
    expect(parseDate('14-05-2026')).toBe('2026-05-14');
    expect(parseDate('14.05.2026')).toBe('2026-05-14');
    expect(parseDate('1/2/2026')).toBe('2026-02-01');
  });

  it('parses ISO-ordered dates', () => {
    expect(parseDate('2026-05-14')).toBe('2026-05-14');
    expect(parseDate('2026/05/14')).toBe('2026-05-14');
  });

  it('parses two-digit years with a 1970 pivot', () => {
    expect(parseDate('14/05/26')).toBe('2026-05-14');
    expect(parseDate('14/05/99')).toBe('1999-05-14');
    expect(parseDate('14/05/70')).toBe('1970-05-14');
    expect(parseDate('14/05/69')).toBe('2069-05-14');
  });

  it('parses written month names, long and short, any case', () => {
    expect(parseDate('14 May 2026')).toBe('2026-05-14');
    expect(parseDate('14 MAY 26')).toBe('2026-05-14');
    expect(parseDate('3 September 2025')).toBe('2025-09-03');
  });

  it('rejects impossible calendar dates', () => {
    expect(parseDate('31/02/2026')).toBeUndefined();
    expect(parseDate('29/02/2025')).toBeUndefined();
    expect(parseDate('00/01/2026')).toBeUndefined();
    expect(parseDate('14/13/2026')).toBeUndefined();
  });

  it('accepts leap days only in leap years', () => {
    expect(parseDate('29/02/2024')).toBe('2024-02-29');
    expect(parseDate('29/02/2000')).toBe('2000-02-29');
    expect(parseDate('29/02/1900')).toBeUndefined();
  });

  it('rejects years outside a sane statement range', () => {
    expect(parseDate('14/05/1899')).toBeUndefined();
    expect(parseDate('14/05/2101')).toBeUndefined();
  });

  it('rejects text that is not a date', () => {
    expect(parseDate('')).toBeUndefined();
    expect(parseDate('  ')).toBeUndefined();
    expect(parseDate('Opening Balance')).toBeUndefined();
    expect(parseDate('14 Notamonth 2026')).toBeUndefined();
    expect(parseDate('14/05')).toBeUndefined();
  });

  it('trims surrounding whitespace', () => {
    expect(parseDate('  14/05/2026  ')).toBe('2026-05-14');
  });
});

describe('parseAmount', () => {
  it('parses plain decimal amounts into cents', () => {
    expect(parseAmount('12.50')).toEqual({ cents: 1250, negative: false });
    expect(parseAmount('0.05')).toEqual({ cents: 5, negative: false });
    expect(parseAmount('1000')).toEqual({ cents: 100000, negative: false });
  });

  it('pads single decimal places', () => {
    expect(parseAmount('12.5')).toEqual({ cents: 1250, negative: false });
  });

  it('parses negative amounts with a leading minus', () => {
    expect(parseAmount('-45.00')).toEqual({ cents: 4500, negative: true });
  });

  it('parses parenthesised negatives', () => {
    expect(parseAmount('(45.00)')).toEqual({ cents: 4500, negative: true });
    expect(parseAmount('( 45.00 )')).toEqual({ cents: 4500, negative: true });
  });

  it('keeps parenthesised minus amounts negative', () => {
    expect(parseAmount('(-45.00)')).toEqual({ cents: 4500, negative: true });
  });

  it('accepts an explicit plus sign', () => {
    expect(parseAmount('+45.00')).toEqual({ cents: 4500, negative: false });
  });

  it('strips currency symbols and thousands separators', () => {
    expect(parseAmount('$1,234.56')).toEqual({ cents: 123456, negative: false });
    expect(parseAmount('-$1,234,567.89')).toEqual({ cents: 123456789, negative: true });
  });

  it('treats negative zero as positive zero', () => {
    expect(parseAmount('-0.00')).toEqual({ cents: 0, negative: false });
  });

  it('rejects malformed numbers', () => {
    expect(parseAmount('')).toBeUndefined();
    expect(parseAmount('  ')).toBeUndefined();
    expect(parseAmount('-')).toBeUndefined();
    expect(parseAmount('12.345')).toBeUndefined();
    expect(parseAmount('1,23.45')).toBeUndefined();
    expect(parseAmount('12..50')).toBeUndefined();
    expect(parseAmount('abc')).toBeUndefined();
    expect(parseAmount('12.50 CR')).toBeUndefined();
  });
});
