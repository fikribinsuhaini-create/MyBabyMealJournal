import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, Pill } from '../components/Ui';
import { formatDisplayDate, todayIso } from '../utils/date';
import type { AppData, BabyProfile } from '../types';

const mealCards = [
  { label: 'Sarapan', key: 'breakfast', time: '07:30', tone: 'bg-peach/20 text-peachDeep' },
  { label: 'Tengah Hari', key: 'lunch', time: '12:30', tone: 'bg-sage/20 text-sageDeep' },
  { label: 'Petang', key: 'evening', time: '15:30', tone: 'bg-butter/35 text-cocoa' },
  { label: 'Malam', key: 'dinner', time: '18:30', tone: 'bg-white/80 text-cocoa' },
] as const;

export function DashboardView({
  data,
  upsert,
}: {
  data: AppData;
  upsert: (sheet: 'BabyProfile', row: BabyProfile) => Promise<void>;
}) {
  const todayDate = formatDisplayDate(todayIso());
  const schedule = data.FeedingSchedule.find((item) => item.date === todayIso()) ?? null;
  const reactionCount = data.FoodTracker.filter((item) => item.reaction && item.reaction !== 'Belum Dinilai').length;

  const stats = useMemo(
    () => [
      ['Resepi', data.Recipes.length.toString()],
      ['Makanan', data.FoodTracker.length.toString()],
      ['Reaksi', reactionCount.toString()],
    ],
    [data.Recipes.length, data.FoodTracker.length, reactionCount]
  );

  return (
    <div className="space-y-5">
      <Card className="bg-[#fbf7ef] p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sageDeep">Hari ini</p>
            <h3 className="text-lg font-bold">Ringkasan</h3>
          </div>
          <div className="text-right">
            <Pill tone="sage">{schedule?.day ?? '—'}</Pill>
            <p className="mt-1 text-[11px] font-semibold text-cocoa/55">{todayDate}</p>
          </div>
        </div>

        {schedule ? (
          <div className="grid grid-cols-2 gap-3">
            {mealCards.map(({ label, key, time, tone }) => (
              <div key={key} className={`rounded-[22px] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${tone}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-90">{label}</p>
                  <span className="rounded-full bg-white/65 px-2 py-0.5 text-[10px] font-semibold text-cocoa/70">{time}</span>
                </div>
                <p className="mt-3 text-lg font-bold leading-tight">{schedule[key] || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-oat bg-white/65 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-cocoa/70">Belum ada jadual untuk tarikh ini.</p>
            <p className="mt-1 text-xs text-cocoa/55">Tambah dalam tab Jadual dulu.</p>
          </div>
        )}
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
