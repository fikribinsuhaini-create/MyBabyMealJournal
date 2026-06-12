import { useCallback, useEffect, useMemo, useState } from 'react';
import { appsScriptEnabled, bootstrapAppsScript, deleteAppsScriptRow, fetchAppsScriptData, seedAppsScriptData, upsertAppsScriptRow } from '../data/appsScript';
import { createId, loadLocalData, replaceSheet, saveLocalData } from '../data/localStore';
import type { AppData, SheetName, SyncState } from '../types';

type RowFor<T extends SheetName> = AppData[T][number];

function hasAnyRows(data: Partial<AppData>) {
  return Object.values(data).some((rows) => Array.isArray(rows) && rows.length > 0);
}

export function useBabyFoodData() {
  const [data, setData] = useState<AppData>(() => loadLocalData());
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const remoteEnabled = useMemo(() => appsScriptEnabled(), []);

  const syncFromRemote = useCallback(async () => {
    if (!remoteEnabled) {
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

      const local = loadLocalData();
      if (!hasAnyRows(remote) && hasAnyRows(local)) {
        await seedAppsScriptData(local);
        remote = await fetchAppsScriptData();
      }

      const next = { ...loadLocalData(), ...remote };
      setData(next);
      saveLocalData(next);
      setSyncState('synced');
    } catch {
      setSyncState('error');
      setSyncMessage('Sync awal gagal. Check deploy Apps Script / URL exec.');
    }
  }, [remoteEnabled]);

  useEffect(() => {
    syncFromRemote();
  }, [syncFromRemote]);

  const commit = useCallback((next: AppData) => {
    setData(next);
    saveLocalData(next);
  }, []);

  const upsert = useCallback(
    async <T extends SheetName>(sheet: T, row: Omit<RowFor<T>, 'id'> & { id?: string }) => {
      const id = row.id || createId(sheet.toLowerCase());
      const savedRow = { ...row, id } as RowFor<T>;
      const rows = data[sheet] as RowFor<T>[];
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
        setSyncState('synced');
      } catch {
        setSyncState('error');
        setSyncMessage('Save ke Apps Script gagal. Redeploy latest version.');
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
        setSyncState('synced');
      } catch {
        setSyncState('error');
        setSyncMessage('Delete ke Apps Script gagal. Redeploy latest version.');
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
