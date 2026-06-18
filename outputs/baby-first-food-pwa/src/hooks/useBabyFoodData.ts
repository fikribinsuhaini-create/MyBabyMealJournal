import { useCallback, useEffect, useMemo, useState } from 'react';
import { appsScriptEnabled, bootstrapAppsScript, deleteAppsScriptRow, fetchAppsScriptData, seedAppsScriptData, upsertAppsScriptRow } from '../data/appsScript';
import { createId, loadLocalData, replaceSheet, saveLocalData } from '../data/localStore';
import type { AppData, SheetName, SyncState } from '../types';
import { normalizeFeedingSchedule } from '../utils/schedule';

type RowFor<T extends SheetName> = AppData[T][number];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function hasAnyRows(data: Partial<AppData>) {
  return Object.values(data).some((rows) => Array.isArray(rows) && rows.length > 0);
}

function normalizeAppData(data: AppData): AppData {
  return {
    ...data,
    FeedingSchedule: data.FeedingSchedule.map((row) => normalizeFeedingSchedule(row)),
  };
}

function mergeRemoteData(local: AppData, remote: Partial<AppData>) {
  const next: AppData = { ...local };

  (Object.keys(local) as SheetName[]).forEach((sheet) => {
    const remoteRows = remote[sheet];
    if (!Array.isArray(remoteRows)) {
      return;
    }

    switch (sheet) {
      case 'BabyProfile':
        next.BabyProfile = remoteRows as AppData['BabyProfile'];
        break;
      case 'MenuPlanner':
        next.MenuPlanner = remoteRows as AppData['MenuPlanner'];
        break;
      case 'FeedingSchedule':
        next.FeedingSchedule = (remoteRows as AppData['FeedingSchedule']).map((row) => normalizeFeedingSchedule(row));
        break;
      case 'Recipes':
        next.Recipes = remoteRows as AppData['Recipes'];
        break;
      case 'FoodTracker':
        next.FoodTracker = remoteRows as AppData['FoodTracker'];
        break;
    }
  });

  return next;
}

function rowMatchesRemote<T extends SheetName>(sheet: T, localRow: RowFor<T>, remoteRow: RowFor<T>) {
  if (localRow.id !== remoteRow.id) return false;

  if (sheet === 'FoodTracker') {
    const nextLocal = localRow as RowFor<'FoodTracker'>;
    const nextRemote = remoteRow as RowFor<'FoodTracker'>;
    const wantsUploadedImage = Boolean(nextLocal.image_url) && nextLocal.image_url.startsWith('data:image/');
    const remoteHasUploadedImage = Boolean(nextRemote.image_url) && !nextRemote.image_url.startsWith('data:image/');

    return (
      nextLocal.food_name === nextRemote.food_name &&
      nextLocal.introduced_date === nextRemote.introduced_date &&
      nextLocal.status === nextRemote.status &&
      nextLocal.reaction === nextRemote.reaction &&
      nextLocal.notes === nextRemote.notes &&
      (wantsUploadedImage ? remoteHasUploadedImage : nextLocal.image_url === nextRemote.image_url)
    );
  }

  return JSON.stringify(localRow) === JSON.stringify(remoteRow);
}

export function useBabyFoodData() {
  const [data, setData] = useState<AppData>(() => normalizeAppData(loadLocalData()));
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const remoteEnabled = useMemo(() => appsScriptEnabled(), []);

  const syncFromRemote = useCallback(async () => {
    if (!remoteEnabled) {
      setSyncMessage('Google Sheet belum connect. Set VITE_GOOGLE_SCRIPT_URL di Vercel.');
      setSyncState(navigator.onLine ? 'local' : 'offline');
      return;
    }

    try {
      setSyncMessage('');
      setSyncState('syncing');
      let remote = await bootstrapAppsScript();
      if (!remote) {
        setSyncState('local');
        return;
      }

      const local = normalizeAppData(loadLocalData());
      if (!hasAnyRows(remote) && hasAnyRows(local)) {
        await seedAppsScriptData(local);
        remote = await fetchAppsScriptData();
      }

      const next = mergeRemoteData(local, remote ?? {});
      const normalized = normalizeAppData(next);
      setData(normalized);
      saveLocalData(normalized);
      setSyncState('synced');
    } catch (error) {
      setSyncState('error');
      const message = error instanceof Error ? error.message : String(error);
      setSyncMessage(`Sync awal gagal: ${message}`);
    }
  }, [remoteEnabled]);

  useEffect(() => {
    syncFromRemote();
  }, [syncFromRemote]);

  const commit = useCallback((next: AppData) => {
    const normalized = normalizeAppData(next);
    setData(normalized);
    saveLocalData(normalized);
  }, []);

  const waitForRemoteRows = useCallback(
    async <T extends SheetName>(sheet: T, matcher: (rows: RowFor<T>[]) => boolean, maxAttempts = 12) => {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const remote = await fetchAppsScriptData();
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];
        if (matcher(remoteRows)) {
          return remote;
        }
        await wait(1500);
      }

      return null;
    },
    []
  );

  const upsert = useCallback(
    async <T extends SheetName>(sheet: T, row: Omit<RowFor<T>, 'id'> & { id?: string }) => {
      const id = row.id || createId(sheet.toLowerCase());
      const savedRow = { ...row, id } as RowFor<T>;
      const rows = data[sheet] as RowFor<T>[];

      const recipeRow = sheet === 'Recipes' ? (savedRow as RowFor<'Recipes'>) : null;
      const trackerRow = sheet === 'FoodTracker' ? (savedRow as RowFor<'FoodTracker'>) : null;

      if (recipeRow && typeof recipeRow.image_url === 'string' && recipeRow.image_url.length > 45000) {
        const nextRows = rows.some((item) => item.id === id)
          ? rows.map((item) => (item.id === id ? savedRow : item))
          : [savedRow, ...rows];
        commit(replaceSheet(data, sheet, nextRows));
        setSyncState('error');
        setSyncMessage('Gambar resepi terlalu besar. Kecilkan gambar atau guna URL pendek.');
        return false;
      }

      if (trackerRow && typeof trackerRow.image_url === 'string' && trackerRow.image_url.length > 50000) {
        setSyncState('error');
        setSyncMessage('Gambar tracker terlalu besar. Pilih gambar lebih kecil.');
        return false;
      }

      const finalRow = savedRow;

      const exists = rows.some((item) => item.id === id);
      const nextRows = exists ? rows.map((item) => (item.id === id ? finalRow : item)) : [finalRow, ...rows];
      const next = replaceSheet(data, sheet, nextRows);
      commit(next);

      if (!remoteEnabled) {
        setSyncState(navigator.onLine ? 'local' : 'offline');
        return true;
      }

      try {
        setSyncMessage('');
        setSyncState('syncing');
        await upsertAppsScriptRow(sheet, finalRow as Record<string, string>);
        const pollAttempts =
          sheet === 'FoodTracker' &&
          typeof (finalRow as RowFor<'FoodTracker'>).image_url === 'string' &&
          (finalRow as RowFor<'FoodTracker'>).image_url.startsWith('data:image/')
            ? 20
            : 12;
        let remote =
          (await waitForRemoteRows(sheet, (remoteRows) => remoteRows.some((item) => rowMatchesRemote(sheet, finalRow, item)), pollAttempts)) ??
          (await fetchAppsScriptData());
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];

        if (!remoteRows.some((item) => rowMatchesRemote(sheet, finalRow, item))) {
          throw new Error('Apps Script save tak sampai ke Google Sheet. Cuba redeploy Apps Script atau kecilkan gambar lagi.');
        }
        if (remote) {
          commit(mergeRemoteData(next, remote));
        }
        setSyncState('synced');
        return true;
      } catch (error) {
        commit(data);
        setSyncState('error');
        const message = error instanceof Error ? error.message : String(error);
        setSyncMessage(`Save ke Apps Script gagal: ${message}`);
        return false;
      }
    },
    [commit, data, remoteEnabled, waitForRemoteRows]
  );

  const remove = useCallback(
    async <T extends SheetName>(sheet: T, id: string) => {
      const rows = data[sheet] as RowFor<T>[];
      const next = replaceSheet(
        data,
        sheet,
        rows.filter((item) => item.id !== id)
      );
      commit(next);

      if (!remoteEnabled) {
        setSyncState(navigator.onLine ? 'local' : 'offline');
        return;
      }

      try {
        setSyncMessage('');
        setSyncState('syncing');
        await deleteAppsScriptRow(sheet, id);
        const remote = await fetchAppsScriptData();
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];
        const existsInRemote = remoteRows.some((item) => item.id === id);
        if (existsInRemote) {
          throw new Error('Apps Script delete tak sampai ke Google Sheet');
        }
        if (remote) {
          commit(mergeRemoteData(next, remote));
        }
        setSyncState('synced');
      } catch (error) {
        commit(data);
        setSyncState('error');
        const message = error instanceof Error ? error.message : String(error);
        setSyncMessage(`Delete ke Apps Script gagal: ${message}`);
      }
    },
    [commit, data, remoteEnabled]
  );

  return {
    data,
    syncState,
    syncMessage,
    sheets: { read: remoteEnabled, write: remoteEnabled },
    upsert,
    remove,
  };
}
