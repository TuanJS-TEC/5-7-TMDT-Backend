/** SĐT VN: 10 số, bắt đầu 0, đầu số di động hợp lệ */
export const VN_PHONE_REGEX = /^0(3|5|7|8|9)[0-9]{8}$/;

export function normalizeVnPhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  let s = value.trim().replace(/\s+/g, '');
  if (s.startsWith('+84')) {
    s = '0' + s.slice(3);
  }
  return s;
}
