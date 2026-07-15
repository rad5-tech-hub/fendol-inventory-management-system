export function normalizePhone(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').replace(/^234/, '').replace(/^0+/, '').slice(0, 11);
  return digits;
}

export function formatPhone(value) {
  const digits = normalizePhone(value);
  if (!digits) return '';
  return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

export function handlePhoneChange(e) {
  const raw = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '').slice(0, 11);
  return raw;
}
