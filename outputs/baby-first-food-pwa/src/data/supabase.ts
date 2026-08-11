import type { AppData, Recipe, FoodTracker, SheetName } from '../types';

export type RemoteRow = Record<string, string | string[]>;

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const storageBucket = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'baby-food-images').trim();

const tableMap: Record<SheetName, string> = {
  BabyProfile: 'baby_profiles',
  MenuPlanner: 'menu_planner',
  FeedingSchedule: 'feeding_schedule',
  Recipes: 'recipes',
  FoodTracker: 'food_tracker',
  FoodLibrary: 'food_library',
  MenuIdeas: 'menu_ideas',
};

function requireSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase belum connect. Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }
}

function restUrl(table: string, params?: Record<string, string>) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

function apiHeaders(extra?: Record<string, string>) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    ...extra,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeTextRow<T extends Record<string, unknown>>(row: T) {
  return Object.entries(row).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      accumulator[key] = value.map((item) => String(item));
    } else {
      accumulator[key] = value === null || value === undefined ? '' : String(value);
    }
    return accumulator;
  }, {}) as T;
}

async function readTable<T>(table: string) {
  requireSupabase();
  const response = await fetch(restUrl(table, { select: '*' }), {
    headers: apiHeaders(),
  });
  return readJson<T[]>(response);
}

async function upsertTableRows<T extends Record<string, unknown>>(table: string, rows: T[]) {
  requireSupabase();
  if (!rows.length) return;

  const response = await fetch(restUrl(table, { on_conflict: 'id' }), {
    method: 'POST',
    headers: apiHeaders({
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify(rows),
  });

  await readJson<T[]>(response);
}

async function deleteTableRow(table: string, id: string) {
  requireSupabase();
  const response = await fetch(restUrl(table, { id: `eq.${id}` }), {
    method: 'DELETE',
    headers: apiHeaders({
      Prefer: 'return=minimal',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase delete HTTP ${response.status}`);
  }
}

function parseDataUrl(dataUrl: string) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format gambar tak sah.');
  }

  return {
    mimeType: match[1],
    base64: match[2],
    extension: match[1].split('/')[1] || 'jpg',
  };
}

function base64ToBytes(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeStoragePath(path: string) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function uploadImage(dataUrl: string, folder: 'tracker' | 'recipes', fileId: string) {
  requireSupabase();
  const { mimeType, base64, extension } = parseDataUrl(dataUrl);
  const bytes = base64ToBytes(base64);
  const path = `${folder}/${fileId}.${extension}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeStoragePath(`${storageBucket}/${path}`)}`, {
    method: 'POST',
    headers: apiHeaders({
      'Content-Type': mimeType,
      'x-upsert': 'true',
    }),
    body: bytes,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Upload gambar ke Supabase gagal.');
  }

  return `${supabaseUrl}/storage/v1/object/public/${encodeStoragePath(`${storageBucket}/${path}`)}`;
}

async function normalizeRowForRemote<T extends RemoteRow>(sheet: SheetName, row: T): Promise<T> {
  if (sheet === 'FoodTracker') {
    const imageUrls = Array.isArray(row.image_urls) ? row.image_urls : [];
    if (imageUrls.some((url) => url.startsWith('data:image/'))) {
      const uploaded = await Promise.all(
        imageUrls.map((url, index) =>
          url.startsWith('data:image/') ? uploadImage(url, 'tracker', `${row.id}-${index}`) : Promise.resolve(url)
        )
      );
      return { ...row, image_urls: uploaded };
    }
    return row;
  }

  if (sheet === 'Recipes' && typeof row.image_url === 'string' && row.image_url.startsWith('data:image/')) {
    const imageUrl = await uploadImage(row.image_url, 'recipes', row.id as string);
    return { ...row, image_url: imageUrl };
  }

  return row;
}

export async function bootstrapSupabase(): Promise<Partial<AppData> | null> {
  return fetchSupabaseData();
}

export async function fetchSupabaseData(): Promise<Partial<AppData> | null> {
  requireSupabase();
  const [babyProfile, menuPlanner, feedingSchedule, recipes, foodTracker, foodLibrary, menuIdeas] = await Promise.all([
    readTable<AppData['BabyProfile'][number]>(tableMap.BabyProfile),
    readTable<AppData['MenuPlanner'][number]>(tableMap.MenuPlanner),
    readTable<AppData['FeedingSchedule'][number]>(tableMap.FeedingSchedule),
    readTable<AppData['Recipes'][number]>(tableMap.Recipes),
    readTable<AppData['FoodTracker'][number]>(tableMap.FoodTracker),
    readTable<AppData['FoodLibrary'][number]>(tableMap.FoodLibrary),
    readTable<AppData['MenuIdeas'][number]>(tableMap.MenuIdeas),
  ]);

  return {
    BabyProfile: babyProfile.map((row) => normalizeTextRow(row)),
    MenuPlanner: menuPlanner.map((row) => normalizeTextRow(row)),
    FeedingSchedule: feedingSchedule.map((row) => normalizeTextRow(row)),
    Recipes: recipes.map((row) => normalizeTextRow(row)),
    FoodTracker: foodTracker.map((row) => normalizeTextRow(row)),
    FoodLibrary: foodLibrary.map((row) => normalizeTextRow(row)),
    MenuIdeas: menuIdeas.map((row) => normalizeTextRow(row)),
  };
}

export async function upsertSupabaseRow(sheet: SheetName, row: RemoteRow) {
  const finalRow = await normalizeRowForRemote(sheet, row);
  await upsertTableRows(tableMap[sheet], [finalRow]);
  return finalRow;
}

export async function deleteSupabaseRow(sheet: SheetName, id: string) {
  await deleteTableRow(tableMap[sheet], id);
}

export async function seedSupabaseData(data: AppData) {
  const babyProfileRows = await Promise.all(data.BabyProfile.map((row) => normalizeRowForRemote('BabyProfile', row)));
  const menuRows = await Promise.all(data.MenuPlanner.map((row) => normalizeRowForRemote('MenuPlanner', row)));
  const scheduleRows = await Promise.all(data.FeedingSchedule.map((row) => normalizeRowForRemote('FeedingSchedule', row)));
  const recipeRows = await Promise.all(data.Recipes.map((row) => normalizeRowForRemote('Recipes', row as Recipe)));
  const trackerRows = await Promise.all(data.FoodTracker.map((row) => normalizeRowForRemote('FoodTracker', row as FoodTracker)));
  const libraryRows = await Promise.all(data.FoodLibrary.map((row) => normalizeRowForRemote('FoodLibrary', row)));
  const menuIdeaRows = await Promise.all(data.MenuIdeas.map((row) => normalizeRowForRemote('MenuIdeas', row)));

  await Promise.all([
    upsertTableRows(tableMap.BabyProfile, babyProfileRows),
    upsertTableRows(tableMap.MenuPlanner, menuRows),
    upsertTableRows(tableMap.FeedingSchedule, scheduleRows),
    upsertTableRows(tableMap.Recipes, recipeRows),
    upsertTableRows(tableMap.FoodTracker, trackerRows),
    upsertTableRows(tableMap.FoodLibrary, libraryRows),
    upsertTableRows(tableMap.MenuIdeas, menuIdeaRows),
  ]);
}

export function supabaseEnabled() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseStorageBucket() {
  return storageBucket;
}
