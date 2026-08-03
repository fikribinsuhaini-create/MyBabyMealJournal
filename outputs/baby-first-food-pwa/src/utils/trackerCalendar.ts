import { ageCategories, weeks } from '../constants';
import { getMonthsBetweenDates, parseDate } from './date';

export type TrackerWeekInfo = {
  ageCategory: string;
  week: string;
  weekIndex: number;
};

export function weekInfoForDate(birthDate: string, dateValue: string): TrackerWeekInfo | null {
  const birth = parseDate(birthDate);
  const date = parseDate(dateValue);
  if (!birth || !date || date < birth) return null;

  const monthsSinceBirth = getMonthsBetweenDates(birth, date);
  const ageIndex = monthsSinceBirth - 6;
  if (ageIndex < 0) return null;

  const ageCategory = ageCategories[Math.min(ageIndex, ageCategories.length - 1)];

  const bucketStart = new Date(birth);
  bucketStart.setMonth(bucketStart.getMonth() + monthsSinceBirth);
  const daysSinceBucketStart = Math.floor((date.getTime() - bucketStart.getTime()) / 86400000);
  const weekIndex = Math.min(Math.max(Math.floor(daysSinceBucketStart / 7), 0), weeks.length - 1);

  return { ageCategory, week: weeks[weekIndex], weekIndex };
}

export function shortAgeLabel(ageCategory: string) {
  const match = ageCategory.match(/\d+/);
  if (!match) return '';
  return ageCategory.includes('Ke Atas') ? `${match[0]}bl+` : `${match[0]}bl`;
}
