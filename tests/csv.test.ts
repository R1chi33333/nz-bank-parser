import { describe, expect, it } from 'vitest';
import { tokenize } from '../src/csv.js';

describe('tokenize', () => {
  it('splits simple rows on commas and newlines', () => {
    expect(tokenize('a,b,c\nd,e,f')).toEqual([
      { line: 1, fields: ['a', 'b', 'c'] },
      { line: 2, fields: ['d', 'e', 'f'] },
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(tokenize('a,b\r\nc,d\r\n')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 2, fields: ['c', 'd'] },
    ]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(tokenize('﻿Date,Amount\n01/02/2026,5.00')).toEqual([
      { line: 1, fields: ['Date', 'Amount'] },
      { line: 2, fields: ['01/02/2026', '5.00'] },
    ]);
  });

  it('keeps commas inside quoted fields', () => {
    expect(tokenize('"COUNTDOWN, AUCKLAND",12.50')).toEqual([
      { line: 1, fields: ['COUNTDOWN, AUCKLAND', '12.50'] },
    ]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(tokenize('"say ""hi""",x')).toEqual([{ line: 1, fields: ['say "hi"', 'x'] }]);
  });

  it('keeps newlines inside quoted fields and tracks following line numbers', () => {
    expect(tokenize('"two\nlines",x\nnext,row')).toEqual([
      { line: 1, fields: ['two\nlines', 'x'] },
      { line: 3, fields: ['next', 'row'] },
    ]);
  });

  it('skips lines with no content at all', () => {
    expect(tokenize('a,b\n\n\nc,d\n')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 4, fields: ['c', 'd'] },
    ]);
  });

  it('keeps rows whose fields are all empty when delimiters are present', () => {
    expect(tokenize(',,\na,b,c')).toEqual([
      { line: 1, fields: ['', '', ''] },
      { line: 2, fields: ['a', 'b', 'c'] },
    ]);
  });

  it('parses a quoted empty field as a row', () => {
    expect(tokenize('""')).toEqual([{ line: 1, fields: [''] }]);
  });

  it('treats an unterminated quote as running to end of input', () => {
    expect(tokenize('a,"unterminated\nstill going')).toEqual([
      { line: 1, fields: ['a', 'unterminated\nstill going'] },
    ]);
  });

  it('keeps quotes that appear mid-field verbatim', () => {
    expect(tokenize('5\'10" TIMBER,3.99')).toEqual([
      { line: 1, fields: ['5\'10" TIMBER', '3.99'] },
    ]);
  });

  it('keeps text after a closing quote in the same field', () => {
    expect(tokenize('"AB"CD,x')).toEqual([{ line: 1, fields: ['ABCD', 'x'] }]);
  });

  it('handles a trailing comma as an empty final field', () => {
    expect(tokenize('a,b,\n')).toEqual([{ line: 1, fields: ['a', 'b', ''] }]);
  });

  it('returns no rows for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('\n\r\n\n')).toEqual([]);
  });

  it('handles CR without LF as a record terminator', () => {
    expect(tokenize('a,b\rc,d')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 2, fields: ['c', 'd'] },
    ]);
  });
});
