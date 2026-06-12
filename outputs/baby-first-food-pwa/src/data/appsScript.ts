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

async function postMutation(action: 'upsert' | 'delete' | 'seed', payload: Record<string, string>) {
  if (!scriptUrl) return;

  const frameName = `babyFoodPost_${crypto.randomUUID().replace(/-/g, '')}`;
  const iframe = document.createElement('iframe');
  iframe.name = frameName;
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = scriptUrl;
  form.target = frameName;

  const entries = { action, ...payload };
  Object.entries(entries).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  await wait(800);
  form.remove();
  iframe.remove();
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
  await postMutation('upsert', {
    sheet,
    row: JSON.stringify(row),
  });
}

export async function deleteAppsScriptRow(sheet: SheetName, id: string) {
  await postMutation('delete', {
    sheet,
    id,
  });
}

export async function seedAppsScriptData(data: AppData) {
  await postMutation('seed', {
    data: JSON.stringify(data),
  });
}

export function appsScriptEnabled() {
  return Boolean(scriptUrl);
}
