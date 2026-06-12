import type { SheetName } from '../types';

export const sheetColumns: Record<SheetName, string[]> = {
  BabyProfile: ['id', 'baby_name', 'birth_date'],
  MenuPlanner: ['id', 'week', 'day', 'menu'],
  FeedingSchedule: ['id', 'week', 'date', 'day', 'breakfast', 'lunch', 'evening', 'dinner'],
  Recipes: ['id', 'title', 'image_url', 'age_category', 'category', 'ingredients', 'instructions', 'notes', 'source_link'],
  FoodTracker: ['id', 'food_name', 'introduced_date', 'status', 'reaction', 'notes'],
};

export const sheetNames = Object.keys(sheetColumns) as SheetName[];
