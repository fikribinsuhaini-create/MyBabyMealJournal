export function calculateAge(birthDate: string) {
  const birth = parseDate(birthDate);
  const now = new Date();
  if (!birth) return '-';

  let months = getMonthsBetweenDates(birth, now);
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years <= 0) return `${Math.max(remainingMonths, 0)} bulan`;
  return `${years} tahun ${remainingMonths} bulan`;
}

export function getMonthsBetweenDates(fromDate: string | Date, toDate: string | Date) {
  const from = typeof fromDate === 'string' ? parseDate(fromDate) : fromDate;
  const to = typeof toDate === 'string' ? parseDate(toDate) : toDate;
  if (!from || !to) return 0;

  let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(months, 0);
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
