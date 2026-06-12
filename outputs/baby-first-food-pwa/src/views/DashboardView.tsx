import { Edit3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, Pill } from '../components/Ui';
import { days } from '../constants';
import { calculateAge, formatDisplayDate, toDateInputValue, todayIso } from '../utils/date';
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
  const [editProfile, setEditProfile] = useState(false);
  const profile = data.BabyProfile[0];
  const todayName = new Intl.DateTimeFormat('ms-MY', { weekday: 'long' }).format(new Date());
  const today = days.find((day) => todayName.toLowerCase().includes(day.toLowerCase())) ?? 'Jumaat';
  const todayDate = formatDisplayDate(todayIso());
  const schedule = data.FeedingSchedule.find((item) => item.day === today) ?? data.FeedingSchedule[0];
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
      <Card className="bg-peach/35 p-4 text-cocoa">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cocoa/65">Profil Bayi</p>
            <h3 className="mt-1 truncate text-[26px] font-bold leading-tight">{profile?.baby_name || 'Nama bayi'}</h3>
            <p className="mt-2 text-sm font-medium text-cocoa/70">Lahir: {profile?.birth_date ? formatDisplayDate(profile.birth_date) : '-'}</p>
          </div>
          <button type="button" onClick={() => setEditProfile(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-cocoa shadow-sm">
            {profile ? <Edit3 size={18} /> : <Plus size={18} />}
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/85 text-center shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-cocoa/60">Umur</span>
            <span className="text-[15px] font-bold leading-none">{profile ? calculateAge(profile.birth_date) : '-'}</span>
          </div>
        </div>
      </Card>

      <Card className="bg-[#fbf7ef] p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sageDeep">Hari ini</p>
            <h3 className="text-lg font-bold">Ringkasan</h3>
          </div>
          <div className="text-right">
            <Pill tone="sage">{today}</Pill>
            <p className="mt-1 text-[11px] font-semibold text-cocoa/55">{todayDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mealCards.map(({ label, key, time, tone }) => (
            <div key={key} className={`rounded-[22px] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${tone}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-90">{label}</p>
                <span className="rounded-full bg-white/65 px-2 py-0.5 text-[10px] font-semibold text-cocoa/70">{time}</span>
              </div>
              <p className="mt-3 text-lg font-bold leading-tight">{schedule?.[key] || '-'}</p>
            </div>
          ))}
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

      {editProfile ? (
        <FormModal
          title="Profil Bayi"
          fields={[
            { name: 'baby_name', label: 'Nama bayi', placeholder: 'Nama bayi' },
            { name: 'birth_date', label: 'Tarikh lahir', type: 'date' },
          ]}
          initialValues={profile ? { ...profile, birth_date: toDateInputValue(profile.birth_date) } : undefined}
          onClose={() => setEditProfile(false)}
          onSubmit={(values) => {
            upsert('BabyProfile', { id: profile?.id ?? '', baby_name: values.baby_name, birth_date: values.birth_date });
            setEditProfile(false);
          }}
        />
      ) : null}
    </div>
  );
}
