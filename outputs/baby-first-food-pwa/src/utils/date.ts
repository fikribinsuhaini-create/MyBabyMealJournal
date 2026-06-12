export function calculateAge(birthDate: string) {
  const birth = parseDate(birthDate);
  const now = new Date();
  if (!birth) return '-';

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years <= 0) return `${Math.max(remainingMonths, 0)} bulan`;
  return `${years} tahun ${remainingMonths} bulan`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function parseDate(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toDateInputValue(value: string) {
  const parsed = parseDate(value);
  if (!parsed) return '';

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value: string) {
  const parsed = parseDate(value);
  if (!parsed) return value || '-';

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
}
