export type Reaction = 'Belum Dinilai' | '❤️ Sangat Suka' | '😊 Suka' | '😐 Biasa' | '😖 Tidak Suka' | '⚠️ Ada Reaksi';
export type FoodStatus = 'Selamat' | 'Perlu Dipantau' | 'Alergi';
export type AgeCategory =
  | '6 Bulan'
  | '7 Bulan'
  | '8 Bulan'
  | '9 Bulan'
  | '10 Bulan'
  | '11 Bulan'
  | '12 Bulan Ke Atas';
export type FoodCategory = 'Buah' | 'Sayur' | 'Protein' | 'Bubur' | 'Finger Food' | 'Snek' | 'Lain-Lain';

export type BabyProfile = {
  id: string;
  baby_name: string;
  birth_date: string;
};

export type MenuPlanner = {
  id: string;
  week: string;
  date: string;
  day: string;
  menu: string;
  ingredients: string;
  cooking_method: string;
  reaction: Reaction;
  notes: string;
  meal_time: string;
};

export type FeedingSchedule = {
  id: string;
  week: string;
  day: string;
  breakfast: string;
  lunch: string;
  evening: string;
  dinner: string;
};

export type Recipe = {
  id: string;
  title: string;
  image_url: string;
  age_category: AgeCategory;
  category: FoodCategory;
  ingredients: string;
  instructions: string;
  notes: string;
  source_link: string;
};

export type FoodTracker = {
  id: string;
  food_name: string;
  introduced_date: string;
  status: FoodStatus;
  reaction: Reaction;
  notes: string;
};

export type SheetName = 'BabyProfile' | 'MenuPlanner' | 'FeedingSchedule' | 'Recipes' | 'FoodTracker';

export type AppData = {
  BabyProfile: BabyProfile[];
  MenuPlanner: MenuPlanner[];
  FeedingSchedule: FeedingSchedule[];
  Recipes: Recipe[];
  FoodTracker: FoodTracker[];
};

export type SyncState = 'offline' | 'local' | 'syncing' | 'synced' | 'error';
