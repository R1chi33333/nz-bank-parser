import { describe, expect, it } from 'vitest';
import { SUPPORTED_BANKS } from '../src/index.js';

describe('SUPPORTED_BANKS', () => {
  it('lists the four supported banks', () => {
    expect(SUPPORTED_BANKS).toEqual(['anz', 'asb', 'westpac', 'kiwibank']);
  });
});
