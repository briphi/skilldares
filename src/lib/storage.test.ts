import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  hasStorage,
  getHighScore,
  setHighScore,
  getLastShownMessages,
  setLastShownMessage,
} from './storage';

const STORAGE_KEY = 'skilldares.highScore';
const LAST_MESSAGES_KEY = 'skilldares.lastShownMessages';

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

  describe('getLastShownMessages', () => {
    it('returns an empty object when no value is stored', () => {
      expect(getLastShownMessages()).toEqual({});
    });

    it('returns the parsed map when stored', () => {
      localStorage.setItem(
        LAST_MESSAGES_KEY,
        JSON.stringify({ 'right-no-streak': 'Solid.', 'on-fire': 'By the saints.' }),
      );
      expect(getLastShownMessages()).toEqual({
        'right-no-streak': 'Solid.',
        'on-fire': 'By the saints.',
      });
    });

    it('returns empty object when stored value is malformed JSON', () => {
      localStorage.setItem(LAST_MESSAGES_KEY, '{not valid json');
      expect(getLastShownMessages()).toEqual({});
    });

    it('returns empty object when stored value is a JSON primitive (not an object)', () => {
      localStorage.setItem(LAST_MESSAGES_KEY, '"just a string"');
      expect(getLastShownMessages()).toEqual({});
    });

    it('returns empty object when stored value is a JSON array', () => {
      localStorage.setItem(LAST_MESSAGES_KEY, '[1, 2, 3]');
      expect(getLastShownMessages()).toEqual({});
    });

    it('filters out non-string values defensively', () => {
      localStorage.setItem(
        LAST_MESSAGES_KEY,
        JSON.stringify({ 'right-no-streak': 'ok', 'on-fire': 42, comeback: null }),
      );
      expect(getLastShownMessages()).toEqual({ 'right-no-streak': 'ok' });
    });
  });

  describe('setLastShownMessage', () => {
    it('writes the message under the pool key', () => {
      setLastShownMessage('right-no-streak', 'Solid.');
      expect(JSON.parse(localStorage.getItem(LAST_MESSAGES_KEY)!)).toEqual({
        'right-no-streak': 'Solid.',
      });
    });

    it('preserves prior entries when setting a new pool', () => {
      setLastShownMessage('right-no-streak', 'Solid.');
      setLastShownMessage('on-fire', 'By the saints.');
      expect(JSON.parse(localStorage.getItem(LAST_MESSAGES_KEY)!)).toEqual({
        'right-no-streak': 'Solid.',
        'on-fire': 'By the saints.',
      });
    });

    it('overwrites the message for the same pool', () => {
      setLastShownMessage('right-no-streak', 'First.');
      setLastShownMessage('right-no-streak', 'Second.');
      expect(JSON.parse(localStorage.getItem(LAST_MESSAGES_KEY)!)).toEqual({
        'right-no-streak': 'Second.',
      });
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
        expect(() => setLastShownMessage('on-fire', 'anything')).not.toThrow();
      });
    });
  });
});
