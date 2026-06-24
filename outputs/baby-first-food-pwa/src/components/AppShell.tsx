import { Baby, ClipboardList, GalleryVerticalEnd, Home, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SyncState } from '../types';
import type { AppData } from '../types';
import { calculateAge } from '../utils/date';

export type TabKey = 'dashboard' | 'menu' | 'tracker' | 'gallery';

const navItems: Array<{ key: TabKey; label: string; icon: typeof Home }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'menu', label: 'Log Makan', icon: Utensils },
  { key: 'tracker', label: 'Tracker', icon: ClipboardList },
  { key: 'gallery', label: 'Gallery', icon: GalleryVerticalEnd },
];

const syncText: Record<SyncState, string> = {
  offline: 'Offline',
  local: 'Local',
  syncing: 'Sync...',
  synced: 'Synced',
  error: 'Sync error',
};

export function AppShell({
  activeTab,
  setActiveTab,
  syncState,
  syncMessage,
  data,
  children,
}: {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  syncState: SyncState;
  syncMessage?: string;
  data?: AppData;
  children: ReactNode;
}) {
  const babyName = data?.BabyProfile[0]?.baby_name?.trim();
  const babyBirthDate = data?.BabyProfile[0]?.birth_date?.trim();
  const babyAge = babyBirthDate ? calculateAge(babyBirthDate) : '';

  return (
    <div className="min-h-dvh bg-cream text-cocoa">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-cream/90 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[18px] bg-peach text-white shadow-soft">
              <Baby size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sageDeep">Asytar Food Journal</p>
              <h1 className="max-w-[16rem] break-words text-xl font-bold leading-tight">
                {babyName || 'Planner Bayi'}
                {babyAge ? <span className="font-semibold text-cocoa/70"> ({babyAge})</span> : null}
              </h1>
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-sageDeep shadow-sm">{syncText[syncState]}</span>
            {syncMessage ? <p className="mt-1 text-[10px] font-semibold text-berry">{syncMessage}</p> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/92 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-[0_-12px_36px_rgba(111,86,72,0.12)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] text-[11px] font-semibold transition ${
                  active ? 'bg-peach text-white shadow-soft' : 'text-cocoa/65 hover:bg-oat'
                }`}
                aria-label={item.label}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


