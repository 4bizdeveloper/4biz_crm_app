export function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string) {
  return normalizePhone(value).length >= 7;
}
