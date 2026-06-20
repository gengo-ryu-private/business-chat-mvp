import { describe, expect, it } from 'vitest';

import {
  VALIDATION_LIMITS,
  hasExactLength,
  isBlankMessage,
  isRequired,
  isValidEmail,
  isValidJoinCode,
  isWithinMaxLength,
} from '@/utils/validation';

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

  describe('isWithinMaxLength', () => {
    it('前後空白を除いた文字数が上限以内の場合 true を返す', () => {
      expect(
        isWithinMaxLength(
          'a'.repeat(VALIDATION_LIMITS.channelNameMax),
          VALIDATION_LIMITS.channelNameMax
        )
      ).toBe(true);
    });

    it('前後空白は文字数に含めずに判定する', () => {
      expect(
        isWithinMaxLength(
          ` ${'a'.repeat(VALIDATION_LIMITS.channelNameMax)} `,
          VALIDATION_LIMITS.channelNameMax
        )
      ).toBe(true);
    });

    it('前後空白を除いた文字数が上限を超える場合 false を返す', () => {
      expect(
        isWithinMaxLength(
          'a'.repeat(VALIDATION_LIMITS.channelNameMax + 1),
          VALIDATION_LIMITS.channelNameMax
        )
      ).toBe(false);
    });
  });

  describe('hasExactLength', () => {
    it('前後空白を除いた文字数が指定文字数と一致する場合 true を返す', () => {
      expect(hasExactLength(' ABC123 ', VALIDATION_LIMITS.joinCodeLength)).toBe(
        true
      );
    });

    it('前後空白を除いた文字数が指定文字数と一致しない場合 false を返す', () => {
      expect(hasExactLength('ABC12', VALIDATION_LIMITS.joinCodeLength)).toBe(
        false
      );
    });
  });

  describe('isValidJoinCode', () => {
    it('6文字の許可文字だけで構成される場合 true を返す', () => {
      expect(isValidJoinCode('ABC234')).toBe(true);
    });

    it('誤読しやすい 0/O/I/1 を含む場合 false を返す', () => {
      expect(isValidJoinCode('0OI123')).toBe(false);
    });

    it('小文字を含む場合 false を返す', () => {
      expect(isValidJoinCode('abc234')).toBe(false);
    });

    it('6文字未満の場合 false を返す', () => {
      expect(isValidJoinCode('ABC23')).toBe(false);
    });

    it('6文字を超える場合 false を返す', () => {
      expect(isValidJoinCode('ABC2345')).toBe(false);
    });
  });
});
