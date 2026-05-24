import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasStorage, getHighScore, setHighScore } from './storage';

const STORAGE_KEY = 'skilldares.highScore';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasStorage', () => {
    it('returns true when localStorage works', () => {
      expect(hasStorage()).toBe(true);
    });

    it('does not leave the probe key behind', () => {
      hasStorage();
      expect(localStorage.getItem('__skilldares_storage_probe__')).toBeNull();
    });

    describe('when localStorage.setItem throws', () => {
      let original: typeof Storage.prototype.setItem;

      beforeEach(() => {
        original = Storage.prototype.setItem;
        Storage.prototype.setItem = () => {
          throw new Error('storage blocked');
        };
      });

      afterEach(() => {
        Storage.prototype.setItem = original;
      });

      it('returns false', () => {
        expect(hasStorage()).toBe(false);
      });
    });
  });

  describe('getHighScore', () => {
    it('returns null when no value is stored', () => {
      expect(getHighScore()).toBeNull();
    });

    it('returns the stored integer', () => {
      localStorage.setItem(STORAGE_KEY, '142');
      expect(getHighScore()).toBe(142);
    });

    it('returns the stored zero (not falsy-null)', () => {
      localStorage.setItem(STORAGE_KEY, '0');
      expect(getHighScore()).toBe(0);
    });

    it('returns null for a non-numeric stored value (corrupted state)', () => {
      localStorage.setItem(STORAGE_KEY, 'not-a-number');
      expect(getHighScore()).toBeNull();
    });
  });

  describe('setHighScore', () => {
    it('writes the score to localStorage', () => {
      setHighScore(99);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('99');
    });

    it('overwrites a previous value', () => {
      setHighScore(50);
      setHighScore(100);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('100');
    });

    describe('when localStorage.setItem throws', () => {
      let original: typeof Storage.prototype.setItem;

      beforeEach(() => {
        original = Storage.prototype.setItem;
        Storage.prototype.setItem = () => {
          throw new Error('storage blocked');
        };
      });

      afterEach(() => {
        Storage.prototype.setItem = original;
      });

      it('does not throw (silent no-op)', () => {
        expect(() => setHighScore(42)).not.toThrow();
      });
    });
  });
});
