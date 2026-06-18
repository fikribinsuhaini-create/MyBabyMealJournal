import { ageCategories } from '../constants';
import type { FeedingSchedule } from '../types';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function extractAgeCategory(value: string) {
  const match = value.match(new RegExp(`(${ageCategories.map(escapeRegExp).join('|')})`, 'i'));
  if (!match) return '';

  const found = ageCategories.find((ageCategory) => ageCategory.toLowerCase() === match[1].toLowerCase());
  return found ?? '';
}

function inferAgeCategory(row: FeedingSchedule) {
  const fields = [row.breakfast, row.lunch, row.evening, row.dinner];
  for (const field of fields) {
    const ageCategory = extractAgeCategory(field);
    if (ageCategory) return ageCategory;
  }

  return ageCategories.includes(row.age_category as (typeof ageCategories)[number]) ? row.age_category : '';
}

export function normalizeFeedingSchedule(row: FeedingSchedule): FeedingSchedule {
  const next = { ...row };
  const legacyDateStoredInAgeCategory = isIsoDate(next.age_category) && !isIsoDate(next.date);

  if (legacyDateStoredInAgeCategory) {
    const legacyDate = next.age_category;
    const legacyDay = next.date;
    const inferredAgeCategory = inferAgeCategory(next);
    next.date = legacyDate;
    next.day = legacyDay || next.day;
    next.age_category = inferredAgeCategory || next.age_category;
  }

  if (!next.age_category || !ageCategories.includes(next.age_category as (typeof ageCategories)[number])) {
    const inferredAgeCategory = inferAgeCategory(next);
    if (inferredAgeCategory) {
      next.age_category = inferredAgeCategory;
    }
  }

  return next;
}
