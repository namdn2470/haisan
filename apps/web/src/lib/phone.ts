/**
 * Formats a raw phone string (e.g. "0909123456") into a spaced format (e.g. "0909 123 456")
 * for display. Also handles numbers that already have spaces or dashes.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('84')) {
    return `0${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  // fallback: just space every 3-4 chars
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}
