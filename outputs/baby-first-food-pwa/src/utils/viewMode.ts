const STORAGE_KEY = 'asytar-view-only';

export function resolveViewOnly(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get('view');

  if (requested === '1') {
    window.localStorage.setItem(STORAGE_KEY, '1');
    return true;
  }

  if (requested === '0') {
    window.localStorage.removeItem(STORAGE_KEY);
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === '1';
}
