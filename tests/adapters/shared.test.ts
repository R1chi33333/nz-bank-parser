import { describe, expect, it } from 'vitest';
import {
  buildRaw,
  fieldAt,
  findHeaderRow,
  joinParts,
  matchesHeader,
} from '../../src/adapters/shared.js';

describe('matchesHeader', () => {
  it('matches ignoring case and surrounding whitespace', () => {
    expect(matchesHeader([' Date ', 'AMOUNT'], ['Date', 'Amount'])).toBe(true);
  });

  it('rejects different lengths or names', () => {
    expect(matchesHeader(['Date'], ['Date', 'Amount'])).toBe(false);
    expect(matchesHeader(['Date', 'Total'], ['Date', 'Amount'])).toBe(false);
  });
});

describe('findHeaderRow', () => {
  it('finds the header below a metadata preamble', () => {
    const rows = [
      { line: 1, fields: ['Created date / time : 02 July 2026'] },
      { line: 2, fields: ['Date', 'Amount'] },
      { line: 3, fields: ['01/02/2026', '1.00'] },
    ];
    expect(findHeaderRow(rows, ['Date', 'Amount'])).toBe(1);
  });

  it('returns -1 when no header is present', () => {
    expect(findHeaderRow([{ line: 1, fields: ['a', 'b'] }], ['Date', 'Amount'])).toBe(-1);
  });
});

describe('fieldAt', () => {
  it('returns the field at the index', () => {
    expect(fieldAt(['a', 'b'], 1)).toBe('b');
  });

  it('throws on out-of-range access, which signals a parser bug', () => {
    expect(() => fieldAt(['a'], 3)).toThrow('out of validated range');
  });
});

describe('joinParts', () => {
  it('joins non-empty trimmed parts with spaces', () => {
    expect(joinParts(' a ', '', 'b', '  ')).toBe('a b');
    expect(joinParts('', '')).toBe('');
  });
});

describe('buildRaw', () => {
  it('maps header names to field values, padding missing fields', () => {
    expect(buildRaw(['Date', 'Amount'], ['01/02/2026'])).toEqual({
      Date: '01/02/2026',
      Amount: '',
    });
  });
});
