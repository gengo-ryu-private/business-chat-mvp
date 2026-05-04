import { describe, expect, it } from 'vitest';

import { generateJoinCode } from '@/utils/join-code';

describe('join-code utils', () => {
  it('デフォルトでは6文字の参加コードを生成する', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('指定した文字数の参加コードを生成する', () => {
    expect(generateJoinCode(10)).toHaveLength(10);
  });

  it('利用可能な文字だけで参加コードを生成する', () => {
    const code = generateJoinCode(100);

    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('見間違えやすい文字を含まない', () => {
    const code = generateJoinCode(100);

    expect(code).not.toMatch(/[IO01]/);
  });
});
