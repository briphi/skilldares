import { describe, it, expect } from 'vitest';
import { formatFactorValue } from './formatters';

describe('formatFactorValue', () => {
  describe('price', () => {
    it('formats integer price as "$N"', () => {
      expect(formatFactorValue(8, 'price')).toBe('$8');
    });

    it('formats decimal price as "$N.NN"', () => {
      expect(formatFactorValue(8.99, 'price')).toBe('$8.99');
    });

    it('formats large price as "$NN"', () => {
      expect(formatFactorValue(23.99, 'price')).toBe('$23.99');
    });
  });

  describe('ABV', () => {
    it('formats ABV with one decimal + "% ABV"', () => {
      expect(formatFactorValue(4.2, 'ABV')).toBe('4.2% ABV');
    });

    it('integer ABV still gets one decimal', () => {
      expect(formatFactorValue(5, 'ABV')).toBe('5.0% ABV');
    });

    it('higher ABV', () => {
      expect(formatFactorValue(6.5, 'ABV')).toBe('6.5% ABV');
    });
  });
});
