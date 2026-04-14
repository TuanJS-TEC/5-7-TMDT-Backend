/** Chuẩn hoá SĐT VN về dạng 84xxxxxxxxx (chỉ số, không dấu +) */
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

export function isLikelyVietnamMobile(normalized: string): boolean {
  return /^84(3|5|7|8|9)[0-9]{8}$/.test(normalized);
}
