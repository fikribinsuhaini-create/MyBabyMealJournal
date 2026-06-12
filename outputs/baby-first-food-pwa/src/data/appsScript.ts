import type { AppData, SheetName } from '../types';

const scriptUrl = (import.meta.env.VITE_GOOGLE_SCRIPT_URL ?? '').trim();

type AppsScriptResponse<T> = {
  ok: boolean;
  message?: string;
  data?: T;
};

type JsonpWindow = Window & typeof globalThis & Record<string, unknown>;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function jsonpRequest<T>(params: Record<string, string>) {
  if (!scriptUrl) return null;

  const callbackName = `babyFoodJsonp_${crypto.randomUUID().replace(/-/g, '')}`;
  const url = new URL(scriptUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('callback', callbackName);

  return new Promise<AppsScriptResponse<T>>((resolve, reject) => {
    const script = document.createElement('script');
    const callbackWindow = window as unknown as JsonpWindow;
    const cleanup = () => {
      delete callbackWindow[callbackName];
      script.remove();
    };

    callbackWindow[callbackName] = (payload: AppsScriptResponse<T>) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Apps Script JSONP failed'));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

export async function bootstrapAppsScript(): Promise<Partial<AppData> | null> {
  if (!scriptUrl) return null;
  const response = await jsonpRequest<Partial<AppData>>({ action: 'bootstrap' });
  if (!response?.ok) throw new Error(response?.message || 'Apps Script bootstrap failed');
  return response.data ?? null;
}

export async function fetchAppsScriptData(): Promise<Partial<AppData> | null> {
  if (!scriptUrl) return null;
  const response = await jsonpRequest<Partial<AppData>>({ action: 'readAll' });
  if (!response?.ok) throw new Error(response?.message || 'Apps Script read failed');
  return response.data ?? null;
}

export async function upsertAppsScriptRow(sheet: SheetName, row: Record<string, string>) {
  const response = await jsonpRequest<{ saved?: boolean }>({
    action: 'upsert',
    sheet,
    row: JSON.stringify(row),
  });
  if (!response?.ok) throw new Error(response?.message || 'Apps Script upsert failed');
}

export async function deleteAppsScriptRow(sheet: SheetName, id: string) {
  const response = await jsonpRequest<{ deleted?: boolean }>({
    action: 'delete',
    sheet,
    id,
  });
  if (!response?.ok) throw new Error(response?.message || 'Apps Script delete failed');
}

export async function seedAppsScriptData(data: AppData) {
  const response = await jsonpRequest<{ seeded?: boolean }>({
    action: 'seed',
    data: JSON.stringify(data),
  });
  if (!response?.ok) throw new Error(response?.message || 'Apps Script seed failed');
}

export function appsScriptEnabled() {
  return Boolean(scriptUrl);
}
