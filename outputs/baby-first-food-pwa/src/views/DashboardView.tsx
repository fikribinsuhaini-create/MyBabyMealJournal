import { useMemo } from 'react';
import { Card, Pill } from '../components/Ui';
import type { AppData, BabyProfile } from '../types';
import { formatDisplayDate, todayIso } from '../utils/date';

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
}: {
  data: AppData;
  upsert: (sheet: 'BabyProfile', row: BabyProfile) => Promise<void>;
}) {
  void upsert;

  const todayDate = formatDisplayDate(todayIso());
  const logCount = data.FoodTracker.length;
  const reactionCount = data.FoodTracker.filter((item) => item.reaction && item.reaction !== 'Belum Dinilai').length;
  const galleryCount = data.FoodTracker.filter((item) => item.image_url).length;
  const legacyMenuCount = data.MenuPlanner.length;

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

      {legacyMenuCount ? (
        <Card className="bg-sage/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sageDeep">Log lama</p>
              <p className="mt-1 text-sm font-semibold text-cocoa/65">MenuPlanner lama masih selamat dalam Tracker.</p>
            </div>
            <Pill tone="sage">{legacyMenuCount} menu</Pill>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-3 text-center">
            <p className="text-2xl font-bold text-sageDeep">{value}</p>
            <p className="mt-1 text-[11px] font-semibold text-cocoa/65">{label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
