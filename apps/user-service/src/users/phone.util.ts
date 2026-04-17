export function normalizeVietnamPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('84')) {
    return d;
  }
  if (d.startsWith('0') && d.length >= 10) {
    return `84${d.slice(1)}`;
  }
  if (d.length === 9 && !d.startsWith('0')) {
    return `84${d}`;
  }
  return d;
}
