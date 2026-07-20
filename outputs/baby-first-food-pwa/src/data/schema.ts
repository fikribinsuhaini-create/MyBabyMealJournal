import type { SheetName } from '../types';

export const sheetColumns: Record<SheetName, string[]> = {
  BabyProfile: ['id', 'baby_name', 'birth_date'],
  MenuPlanner: ['id', 'week', 'age_category', 'date', 'day', 'menu'],
  FeedingSchedule: ['id', 'week', 'age_category', 'date', 'day', 'breakfast', 'lunch', 'evening', 'dinner'],
  Recipes: ['id', 'title', 'image_url', 'age_category', 'category', 'author', 'ingredients', 'instructions', 'notes'],
  FoodTracker: ['id', 'food_name', 'introduced_date', 'status', 'reaction', 'notes', 'image_urls'],
};

export const sheetNames = Object.keys(sheetColumns) as SheetName[];
