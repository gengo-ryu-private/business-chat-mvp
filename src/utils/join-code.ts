const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateJoinCode(length = 6): string {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    return JOIN_CODE_CHARS[index];
  }).join('');
}
