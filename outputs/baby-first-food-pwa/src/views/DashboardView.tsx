import { CalendarX, ImageOff } from 'lucide-react';
import { useMemo } from 'react';
import { DashboardWeekStrip } from '../components/DashboardWeekStrip';
import { Card, Pill } from '../components/Ui';
import type { AppData, BabyProfile } from '../types';
import { addDaysIso, formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';

const META_START = '[[baby-food-meta:';
const META_END = ']]';

function cleanNotes(notes = '') {
  if (!notes.startsWith(META_START)) return notes;
  const closeIndex = notes.indexOf(META_END);
  if (closeIndex === -1) return notes;
  return notes.slice(closeIndex + META_END.length).replace(/^\n+/, '');
}

export function DashboardView({
  data,
  upsert,
  onOpenTrackerCalendar,
  onAddTrackerForDate,
  onGoToTracker,
}: {
  data: AppData;
  upsert: (sheet: 'BabyProfile', row: BabyProfile) => Promise<void>;
  onOpenTrackerCalendar?: () => void;
  onAddTrackerForDate?: (iso: string) => void;
  onGoToTracker?: () => void;
}) {
  void upsert;

  const todayDate = formatDisplayDate(todayIso());
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

  const latestTracker = useMemo(
    () =>
      [...data.FoodTracker].sort((left, right) => {
        const leftTime = new Date(left.introduced_date || '1970-01-01').getTime();
        const rightTime = new Date(right.introduced_date || '1970-01-01').getTime();
        return rightTime - leftTime;
      })[0] ?? null,
    [data.FoodTracker]
  );

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
      {onAddTrackerForDate ? (
        <DashboardWeekStrip rows={data.FoodTracker} onAddForDate={onAddTrackerForDate} onOpenFullCalendar={onOpenTrackerCalendar} />
      ) : null}

      {missedDates.length > 0 ? (
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

      {missingPhotoCount > 0 ? (
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

      <Card className="bg-[#fbf7ef] p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sageDeep">Hari ini</p>
            <h3 className="text-lg font-bold">Jurnal ringkas</h3>
          </div>
          <div className="text-right">
            <Pill tone="sage">{todayDate}</Pill>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[22px] bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa/60">Log terbaru</p>
            <p className="mt-2 text-lg font-bold leading-tight text-cocoa">{latestTracker?.food_name || '-'}</p>
            <p className="mt-1 text-sm font-semibold text-cocoa/55">
              {latestTracker?.introduced_date ? `${formatDisplayDate(latestTracker.introduced_date)} - ${latestTracker.reaction}` : 'Belum ada log makan lagi'}
            </p>
          </div>

          <div className="rounded-[22px] bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa/60">Diari terbaru</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-cocoa/70">{latestTracker ? cleanNotes(latestTracker.notes) || 'Belum ada catatan.' : 'Belum ada feedback tracker lagi'}</p>
          </div>
        </div>
      </Card>

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