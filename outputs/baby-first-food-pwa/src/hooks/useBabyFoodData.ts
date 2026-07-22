import { useCallback, useEffect, useMemo, useState } from 'react';
import { bootstrapSupabase, deleteSupabaseRow, fetchSupabaseData, seedSupabaseData, supabaseEnabled, upsertSupabaseRow } from '../data/supabase';
import type { RemoteRow } from '../data/supabase';
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
      case 'FoodLibrary':
        next.FoodLibrary = remoteRows as AppData['FoodLibrary'];
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
    const localUrls = nextLocal.image_urls ?? [];
    const remoteUrls = nextRemote.image_urls ?? [];
    const wantsUploadedImages = localUrls.some((url) => url.startsWith('data:image/'));
    const remoteHasNoPendingUploads = remoteUrls.every((url) => !url.startsWith('data:image/'));

    return (
      nextLocal.food_name === nextRemote.food_name &&
      nextLocal.introduced_date === nextRemote.introduced_date &&
      nextLocal.status === nextRemote.status &&
      nextLocal.reaction === nextRemote.reaction &&
      nextLocal.notes === nextRemote.notes &&
      localUrls.length === remoteUrls.length &&
      (wantsUploadedImages ? remoteHasNoPendingUploads : localUrls.every((url, index) => url === remoteUrls[index]))
    );
  }

  return JSON.stringify(localRow) === JSON.stringify(remoteRow);
}

export function useBabyFoodData() {
  const [data, setData] = useState<AppData>(() => normalizeAppData(loadLocalData()));
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const remoteEnabled = useMemo(() => supabaseEnabled(), []);

  const syncFromRemote = useCallback(async () => {
    if (!remoteEnabled) {
      setSyncMessage('Supabase belum connect. Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      setSyncState(navigator.onLine ? 'local' : 'offline');
      return;
    }

    try {
      setSyncMessage('');
      setSyncState('syncing');
      let remote = await bootstrapSupabase();
      if (!remote) {
        setSyncState('local');
        return;
      }

      const local = normalizeAppData(loadLocalData());
      if (!hasAnyRows(remote) && hasAnyRows(local)) {
        await seedSupabaseData(local);
        remote = await fetchSupabaseData();
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

      if (trackerRow?.image_urls?.some((url) => url.length > 50000)) {
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
        const remoteRow = (await upsertSupabaseRow(sheet, finalRow as unknown as RemoteRow)) as RowFor<T>;
        const remote = await fetchSupabaseData();
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];

        if (!remoteRows.some((item) => rowMatchesRemote(sheet, remoteRow, item))) {
          throw new Error('Supabase save tak sampai ke database.');
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
        setSyncMessage(`Save ke Supabase gagal: ${message}`);
        return false;
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
        await deleteSupabaseRow(sheet, id);
        const remote = await fetchSupabaseData();
        const remoteRows = (remote?.[sheet] ?? []) as RowFor<T>[];
        const existsInRemote = remoteRows.some((item) => item.id === id);
        if (existsInRemote) {
          throw new Error('Supabase delete tak sampai ke database');
        }
        if (remote) {
          commit(mergeRemoteData(next, remote));
        }
        setSyncState('synced');
      } catch (error) {
        commit(data);
        setSyncState('error');
        const message = error instanceof Error ? error.message : String(error);
        setSyncMessage(`Delete ke Supabase gagal: ${message}`);
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
