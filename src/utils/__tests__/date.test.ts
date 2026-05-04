import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';

import { formatDateTime } from '@/utils/date';

describe('date utils', () => {
  it('Timestamp を日本語ロケールの日時文字列に変換する', () => {
    const timestamp = Timestamp.fromDate(new Date('2026-05-04T12:30:00+09:00'));

    expect(formatDateTime(timestamp)).toBe('2026/05/04 12:30');
  });
});
