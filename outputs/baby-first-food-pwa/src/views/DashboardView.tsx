import { CalendarX, ImageOff } from 'lucide-react';
import { useMemo } from 'react';
import { DashboardWeekStrip } from '../components/DashboardWeekStrip';
import { Card } from '../components/Ui';
import type { AppData, BabyProfile } from '../types';
import { addDaysIso, formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';

export function DashboardView({
  data,
  upsert,
  onOpenTrackerCalendar,
  onAddTrackerForDate,
  onGoToTracker,
  readOnly,
}: {
  data: AppData;
  upsert: (sheet: 'BabyProfile', row: BabyProfile) => Promise<void>;
  onOpenTrackerCalendar?: () => void;
  onAddTrackerForDate?: (iso: string) => void;
  onGoToTracker?: () => void;
  readOnly?: boolean;
}) {
  void upsert;

  const logCount = data.FoodTracker.length;
  const reactionCount = data.FoodTracker.filter((item) => item.reaction && item.reaction !== 'Belum Dinilai').length;
  const galleryCount = data.FoodTracker.reduce((total, item) => total + (item.image_urls?.length ?? 0), 0);
  const missingPhotoCount = data.FoodTracker.filter((item) => !item.image_urls?.length).length;

  const missedDates = useMemo(() => {
    if (!data.FoodTracker.length) return [];
    const loggedDates = new Set(data.FoodTracker.map((row) => toDateInputValue(row.introduced_date)));
    const earliestDate = data.FoodTracker.reduce((earliest, row) => {
      const iso = toDateInputValue(row.introduced_date);
      return iso && (!earliest || iso < earliest) ? iso : earliest;
    }, '');
    const today = todayIso();
    const windowStart = addDaysIso(today, -6);
    const startIso = earliestDate && earliestDate > windowStart ? earliestDate : windowStart;
    const yesterday = addDaysIso(today, -1);

    const missed: string[] = [];
    for (let cursor = startIso; cursor <= yesterday; cursor = addDaysIso(cursor, 1)) {
      if (!loggedDates.has(cursor)) missed.push(cursor);
    }
    return missed;
  }, [data.FoodTracker]);

  const stats = useMemo(
    () => [
      ['Log', logCount.toString()],
      ['Gallery', galleryCount.toString()],
      ['Reaksi', reactionCount.toString()],
    ],
    [galleryCount, logCount, reactionCount]
  );

  return (
    <div className="space-y-5">
      <DashboardWeekStrip
        rows={data.FoodTracker}
        onAddForDate={readOnly ? undefined : onAddTrackerForDate}
        onOpenFullCalendar={onOpenTrackerCalendar}
      />

      {!readOnly && missedDates.length > 0 ? (
        <button
          type="button"
          onClick={onOpenTrackerCalendar}
          className="flex w-full items-center gap-3 rounded-[24px] bg-berry/15 p-4 text-left shadow-soft transition active:scale-[0.99]"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-white/70 text-cocoa">
            <CalendarX size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-cocoa">
              {missedDates.length} hari tak diisi: {missedDates.slice(0, 3).map((iso) => formatDisplayDate(iso)).join(', ')}
              {missedDates.length > 3 ? ', ...' : ''}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-cocoa/60">Tekan untuk buka kalendar & isi tarikh yang tertinggal</p>
          </div>
        </button>
      ) : null}

      {!readOnly && missingPhotoCount > 0 ? (
        <button
          type="button"
          onClick={onGoToTracker}
          className="flex w-full items-center gap-3 rounded-[24px] bg-butter/45 p-4 text-left shadow-soft transition active:scale-[0.99]"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-white/70 text-cocoa">
            <ImageOff size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-cocoa">
              {missingPhotoCount} log belum ada gambar
            </p>
            <p className="mt-0.5 text-xs font-semibold text-cocoa/60">Tekan untuk lihat senarai & tambah gambar</p>
          </div>
        </button>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {stats.map(([label, value]) =>
          label === 'Log' ? (
            <button
              key={label}
              type="button"
              onClick={onOpenTrackerCalendar}
              aria-label="Buka kalendar rujukan minggu"
              title="Buka kalendar rujukan minggu"
              className="rounded-[24px] bg-white p-3 text-center shadow-soft transition active:scale-95"
            >
              <p className="text-2xl font-bold text-sageDeep">{value}</p>
              <p className="mt-1 text-[11px] font-semibold text-cocoa/65">{label}</p>
            </button>
          ) : (
            <Card key={label} className="p-3 text-center">
              <p className="text-2xl font-bold text-sageDeep">{value}</p>
              <p className="mt-1 text-[11px] font-semibold text-cocoa/65">{label}</p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}