import { useMemo } from 'react';
import { Card, Pill } from '../components/Ui';
import { formatDisplayDate, todayIso } from '../utils/date';
import type { AppData, BabyProfile } from '../types';

export function DashboardView({
  data,
  upsert,
}: {
  data: AppData;
  upsert: (sheet: 'BabyProfile', row: BabyProfile) => Promise<void>;
}) {
  const todayDate = formatDisplayDate(todayIso());
  const reactionCount = data.FoodTracker.filter((item) => item.reaction && item.reaction !== 'Belum Dinilai').length;
  const galleryCount = data.FoodTracker.filter((item) => item.image_url).length;
  const logCount = data.MenuPlanner.length;

  const latestLog = useMemo(
    () =>
      [...data.MenuPlanner].sort((left, right) => {
        const leftTime = new Date(left.date || '1970-01-01').getTime();
        const rightTime = new Date(right.date || '1970-01-01').getTime();
        return rightTime - leftTime;
      })[0] ?? null,
    [data.MenuPlanner]
  );

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
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa/60">Log makan terbaru</p>
            <p className="mt-2 text-lg font-bold leading-tight text-cocoa">{latestLog?.menu || '-'}</p>
            <p className="mt-1 text-sm font-semibold text-cocoa/55">
              {latestLog?.date ? `${formatDisplayDate(latestLog.date)} · ${latestLog.day}` : 'Belum ada log makan lagi'}
            </p>
          </div>

          <div className="rounded-[22px] bg-white/75 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa/60">Tracker terbaru</p>
            <p className="mt-2 text-lg font-bold leading-tight text-cocoa">{latestTracker?.food_name || '-'}</p>
            <p className="mt-1 text-sm font-semibold text-cocoa/55">
              {latestTracker?.introduced_date ? `${formatDisplayDate(latestTracker.introduced_date)} · ${latestTracker.reaction}` : 'Belum ada feedback tracker lagi'}
            </p>
          </div>
        </div>
      </Card>

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
