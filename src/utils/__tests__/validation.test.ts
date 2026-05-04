import { describe, expect, it } from 'vitest';

import { isBlankMessage, isRequired, isValidEmail } from '@/utils/validation';

describe('validation utils', () => {
  describe('isRequired', () => {
    it('文字が入力されている場合 true を返す', () => {
      expect(isRequired('山田太郎')).toBe(true);
    });

    it('空文字の場合 false を返す', () => {
      expect(isRequired('')).toBe(false);
    });

    it('空白のみの場合 false を返す', () => {
      expect(isRequired('   ')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('正しいメール形式の場合 true を返す', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('メール形式でない場合 false を返す', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });

  describe('isBlankMessage', () => {
    it('空文字の場合 true を返す', () => {
      expect(isBlankMessage('')).toBe(true);
    });

    it('空白のみの場合 true を返す', () => {
      expect(isBlankMessage('   ')).toBe(true);
    });

    it('本文がある場合 false を返す', () => {
      expect(isBlankMessage('本日の進捗です。')).toBe(false);
    });
  });
});
