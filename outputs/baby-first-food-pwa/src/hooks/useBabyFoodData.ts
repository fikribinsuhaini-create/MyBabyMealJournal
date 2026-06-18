import { useCallback, useEffect, useMemo, useState } from 'react';
import { appsScriptEnabled, bootstrapAppsScript, deleteAppsScriptRow, fetchAppsScriptData, seedAppsScriptData, upsertAppsScriptRow } from '../data/appsScript';
import { createId, loadLocalData, replaceSheet, saveLocalData } from '../data/localStore';
import type { AppData, SheetName, SyncState } from '../types';
import { normalizeFeedingSchedule } from '../utils/schedule';

type RowFor<T extends SheetName> = AppData[T][number];

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
    if (!Array.isArray(remoteRows) || remoteRows.length === 0) {
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

  const upsert = useCallback(
    async <T extends SheetName>(sheet: T, row: Omit<RowFor<T>, 'id'> & { id?: string }) => {
      const id = row.id || createId(sheet.toLowerCase());
      const savedRow = { ...row, id } as RowFor<T>;
      const rows = data[sheet] as RowFor<T>[];

      const recipeRow = sheet === 'Recipes' ? (savedRow as RowFor<'Recipes'>) : null;

      if (recipeRow && typeof recipeRow.image_url === 'string' && recipeRow.image_url.length > 45000) {
        const nextRows = rows.some((item) => item.id === id)
          ? rows.map((item) => (item.id === id ? savedRow : item))
          : [savedRow, ...rows];
        commit(replaceSheet(data, sheet, nextRows));
        setSyncState('error');
        setSyncMessage('Gambar resepi terlalu besar. Kecilkan gambar atau guna URL pendek.');
        return;
      }

      const exists = rows.some((item) => item.id === id);
      const nextRows = exists ? rows.map((item) => (item.id === id ? savedRow : item)) : [savedRow, ...rows];
      const next = replaceSheet(data, sheet, nextRows);
      commit(next);

      if (!remoteEnabled) {
        setSyncState(navigator.onLine ? 'local' : 'offline');
        return;
      }

      try {
        setSyncMessage('');
        setSyncState('syncing');
        await upsertAppsScriptRow(sheet, savedRow as Record<string, string>);
        const remote = await fetchAppsScriptData();
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];
        const existsInRemote = remoteRows.some((item) => item.id === id);
        if (!existsInRemote) {
          throw new Error('Apps Script save tak sampai ke Google Sheet');
        }
        if (remote) {
          commit(mergeRemoteData(next, remote));
        }
        setSyncState('synced');
      } catch (error) {
        setSyncState('error');
        const message = error instanceof Error ? error.message : String(error);
        setSyncMessage(`Save ke Apps Script gagal: ${message}`);
      }
    },
    [commit, data, remoteEnabled]
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
