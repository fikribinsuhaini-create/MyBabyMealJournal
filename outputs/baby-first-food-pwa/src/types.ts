export type Reaction = 'Belum Dinilai' | '❤️ Sangat Suka' | '😊 Suka' | '😐 Biasa' | '🤔 Tak Pasti' | '😖 Tidak Suka' | '⚠️ Ada Reaksi';
export type FoodStatus = 'Selamat' | 'Perlu Dipantau' | 'Alergi';
export type AgeCategory =
  | '6 Bulan'
  | '7 Bulan'
  | '8 Bulan'
  | '9 Bulan'
  | '10 Bulan'
  | '11 Bulan'
  | '12 Bulan Ke Atas';
export type FoodCategory = 'Karbohidrat' | 'Buah' | 'Sayur' | 'Protein' | 'Bubur' | 'Finger Food' | 'Snek' | 'Lain-Lain';
export type MenuAuthor = 'Ayah' | 'Ibu';

export type BabyProfile = {
  id: string;
  baby_name: string;
  birth_date: string;
};

export type MenuPlanner = {
  id: string;
  week: string;
  age_category: AgeCategory;
  date: string;
  day: string;
  menu: string;
};

export type FeedingSchedule = {
  id: string;
  week: string;
  age_category: AgeCategory;
  date: string;
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
  author: MenuAuthor;
  ingredients: string;
  instructions: string;
  notes: string;
};

export type FoodTracker = {
  id: string;
  food_name: string;
  introduced_date: string;
  status: FoodStatus;
  reaction: Reaction;
  notes: string;
  image_urls: string[];
};

export type FoodTriedStatus = 'Sudah Cuba' | 'Belum Cuba';

export type FoodLibraryItem = {
  id: string;
  food_name: string;
  category: FoodCategory;
  tried_status: FoodTriedStatus;
};

export type SheetName = 'BabyProfile' | 'MenuPlanner' | 'FeedingSchedule' | 'Recipes' | 'FoodTracker' | 'FoodLibrary';

export type AppData = {
  BabyProfile: BabyProfile[];
  MenuPlanner: MenuPlanner[];
  FeedingSchedule: FeedingSchedule[];
  Recipes: Recipe[];
  FoodTracker: FoodTracker[];
  FoodLibrary: FoodLibraryItem[];
};

export type SyncState = 'offline' | 'local' | 'syncing' | 'synced' | 'error';
