export function normalizePhone(value) {
  if (!value) return '';
  return value.replace(/[^0-9+]/g, '');
}

export function formatPhone(value) {
  return value || '';
}
