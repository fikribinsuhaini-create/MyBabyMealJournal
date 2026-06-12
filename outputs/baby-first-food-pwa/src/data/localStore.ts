import { sampleData } from './sampleData';
import type { AppData, SheetName } from '../types';

const STORAGE_KEY = 'baby-first-food-data-v2';

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function loadLocalData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    return sampleData;
  }

  try {
    return JSON.parse(raw) as AppData;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
    return sampleData;
  }
}

export function saveLocalData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function replaceSheet<T extends AppData[SheetName][number]>(data: AppData, sheet: SheetName, rows: T[]) {
  return { ...data, [sheet]: rows } as AppData;
}
