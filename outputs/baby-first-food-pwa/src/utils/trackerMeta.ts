const META_START = '[[baby-food-meta:';
const META_END = ']]';

export type TrackerMeta = {
  age_category: string;
  week: string;
  meal_time: string;
  cleanNotes: string;
};

export function parseTrackerNotes(notes = ''): TrackerMeta {
  if (!notes.startsWith(META_START)) {
    return { age_category: '', week: '', meal_time: '', cleanNotes: notes };
  }

  const closeIndex = notes.indexOf(META_END);
  if (closeIndex === -1) {
    return { age_category: '', week: '', meal_time: '', cleanNotes: notes };
  }

  const rawMeta = notes.slice(META_START.length, closeIndex);
  const cleanNotes = notes.slice(closeIndex + META_END.length).replace(/^\n+/, '');

  try {
    const meta = JSON.parse(rawMeta) as Partial<Record<'age_category' | 'week' | 'meal_time', string>>;
    return {
      age_category: meta.age_category ?? '',
      week: meta.week ?? '',
      meal_time: meta.meal_time ?? '',
      cleanNotes,
    };
  } catch {
    return { age_category: '', week: '', meal_time: '', cleanNotes };
  }
}

export function serializeTrackerNotes(notes: string, ageCategory: string, week: string, mealTime: string) {
  const meta = JSON.stringify({ age_category: ageCategory, week, meal_time: mealTime });
  const cleanNotes = notes.trim();
  return cleanNotes ? `${META_START}${meta}${META_END}\n${cleanNotes}` : `${META_START}${meta}${META_END}`;
}
