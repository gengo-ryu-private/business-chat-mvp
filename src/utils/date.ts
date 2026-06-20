import type { Timestamp } from 'firebase/firestore';

export function formatDateTime(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
