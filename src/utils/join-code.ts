import { randomInt } from 'node:crypto';

const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 10): string {
  return Array.from({ length }, () => {
    const index = randomInt(JOIN_CODE_CHARS.length);
    return JOIN_CODE_CHARS[index];
  }).join('');
}
