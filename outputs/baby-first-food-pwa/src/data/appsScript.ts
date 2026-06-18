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
      reject(new Error(`Apps Script JSONP failed: ${url.toString()}`));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function postMutation(action: 'upsert' | 'delete' | 'seed', payload: Record<string, string>, mode: 'auto' | 'iframe' = 'auto') {
  if (!scriptUrl) return;

  const body = new URLSearchParams();
  body.set('action', action);
  Object.entries(payload).forEach(([key, value]) => {
    body.set(key, key === 'row' || key === 'data' ? encodeURIComponent(value) : value);
  });

  if (mode === 'auto') {
    try {
      await Promise.race([
        fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: body.toString(),
        }),
        wait(4000),
      ]);
      await wait(250);
      return;
    } catch (error) {
      // Fallback for environments where cross-origin fetch to Apps Script is blocked.
    }
  }

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
    input.value = key === 'row' || key === 'data' ? encodeURIComponent(value) : value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  let readyForResponse = false;
  const loadPromise = new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 3000);
    iframe.addEventListener(
      'load',
      () => {
        if (!readyForResponse) return;
        window.setTimeout(() => {
          window.clearTimeout(timeoutId);
          finish();
        }, 300);
      },
      { once: true }
    );
  });

  window.setTimeout(() => {
    readyForResponse = true;
  }, 200);
  form.submit();
  await loadPromise;
  await wait(250);
  form.remove();
  iframe.remove();
}

async function jsonpMutation<T>(action: 'upsert' | 'delete', payload: Record<string, string>) {
  return jsonpRequest<T>({ action, ...payload });
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

export async function upsertAppsScriptRow(sheet: SheetName, row: Record<string, string>, mode: 'auto' | 'iframe' = 'auto') {
  const rowString = JSON.stringify(row);
  const hasLargeImagePayload = Object.values(row).some((value) => typeof value === 'string' && value.startsWith('data:image/'));

  if (!hasLargeImagePayload && rowString.length < 5000) {
    const response = await jsonpMutation<{ data?: unknown }>('upsert', {
      sheet,
      row: rowString,
    });
    if (!response?.ok) {
      throw new Error('Apps Script save gagal');
    }
    return;
  }

  await postMutation('upsert', {
    sheet,
    row: rowString,
  }, mode);
}

export async function deleteAppsScriptRow(sheet: SheetName, id: string) {
  const response = await jsonpMutation<{ data?: unknown }>('delete', {
    sheet,
    id,
  });
  if (!response?.ok) {
    throw new Error('Apps Script delete gagal');
  }
}

export async function seedAppsScriptData(data: AppData) {
  await postMutation('seed', {
    data: JSON.stringify(data),
  });
}

export function appsScriptEnabled() {
  return Boolean(scriptUrl);
}
