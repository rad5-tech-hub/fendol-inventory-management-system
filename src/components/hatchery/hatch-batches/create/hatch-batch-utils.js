export const f = (n) => new Intl.NumberFormat().format(n);

export const generateBatchNo = () => {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-4);
  return `HB-${year}-${seq}`;
};

export const parseDate = (str) => {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (date) => {
  if (!date) return '';
  if (date instanceof Date && !isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export const serializeForm = (form) => ({
  ...form,
  dateInjected: form.dateInjected instanceof Date ? formatDate(form.dateInjected) : null,
  dateStripped: form.dateStripped instanceof Date ? formatDate(form.dateStripped) : null,
  dateHatched: form.dateHatched instanceof Date ? formatDate(form.dateHatched) : null,
});

export const deserializeForm = (data) => ({
  ...data,
  dateInjected: data.dateInjected ? parseDate(data.dateInjected) : null,
  dateStripped: data.dateStripped ? parseDate(data.dateStripped) : null,
  dateHatched: data.dateHatched ? parseDate(data.dateHatched) : null,
});
