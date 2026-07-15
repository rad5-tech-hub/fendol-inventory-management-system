export function normalizePhone(value) {
  if (!value) return '';
  return value.replace(/[^0-9+]/g, '');
}

export function formatPhone(value) {
  if (!value) return '';
  return value;
}

export function handlePhoneChange(e) {
  let val = e.target.value;
  val = val.replace(/[^0-9+]/g, '');
  const plusIndex = val.indexOf('+');
  if (plusIndex > 0) val = val.replace(/\+/g, '');
  if (plusIndex === -1 && val.length > 0) val = '+' + val;
  if ((val.match(/\+/g) || []).length > 1) val = val.replace(/\+/g, '').replace(/^/, '+');
  return val;
}
