function stripLeadingZeros(value) {
  return value.replace(/^0+(?=\d)/, '');
}

function limitDigits(value, max = 11) {
  return value.replace(/\d/g, (m, i, s) => s.slice(0, i).replace(/[^0-9]/g, '').length < max ? m : '');
}

export function normalizePhone(value) {
  if (!value) return '';
  return limitDigits(stripLeadingZeros(value.replace(/[^0-9+]/g, '')));
}

export function formatPhone(value) {
  return value || '';
}

export function handlePhoneChange(e) {
  let val = e.target.value;
  val = val.replace(/[^0-9+]/g, '');
  const plusIndex = val.indexOf('+');
  if (plusIndex > 0) val = val.replace(/\+/g, '');
  if (plusIndex === -1 && val.length > 0) val = '+' + val;
  if ((val.match(/\+/g) || []).length > 1) val = val.replace(/\+/g, '').replace(/^/, '+');
  if (!val) return '';
  val = val[0] + limitDigits(val.slice(1));
  return val;
}
