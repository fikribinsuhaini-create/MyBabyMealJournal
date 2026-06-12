import { Edit3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, Pill, SectionTitle } from '../components/Ui';
import { days } from '../constants';
import { calculateAge, formatDisplayDate, toDateInputValue } from '../utils/date';
import type { AppData, BabyProfile } from '../types';

const mealLabels = [
  ['Sarapan', 'breakfast'],
  ['Tengah Hari', 'lunch'],
  ['Petang', 'evening'],
  ['Malam', 'dinner'],
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
      <SectionTitle
        eyebrow="Hari ini"
        title="Ringkas & tenang"
        action={
          <button type="button" onClick={() => setEditProfile(true)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-cocoa shadow-sm">
            {profile ? <Edit3 size={18} /> : <Plus size={18} />}
          </button>
        }
      />

      <Card className="bg-peach text-white">
        <p className="text-sm font-semibold opacity-90">Profil Bayi</p>
        <h3 className="mt-2 text-3xl font-bold">{profile?.baby_name || 'Nama bayi'}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] bg-white/20 p-3">
            <p className="text-xs opacity-80">Tarikh lahir</p>
            <p className="font-semibold">{profile?.birth_date ? formatDisplayDate(profile.birth_date) : '-'}</p>
          </div>
          <div className="rounded-[20px] bg-white/20 p-3">
            <p className="text-xs opacity-80">Umur semasa</p>
            <p className="font-semibold">{profile ? calculateAge(profile.birth_date) : '-'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Ringkasan Hari Ini</h3>
          <Pill tone="sage">{today}</Pill>
        </div>
        <div className="grid gap-3">
          {mealLabels.map(([label, key]) => (
            <div key={key} className="flex items-center justify-between rounded-[18px] bg-cream px-4 py-3">
              <span className="text-sm font-semibold text-cocoa/70">{label}</span>
              <span className="max-w-[56%] text-right text-sm font-bold">{schedule?.[key] || '-'}</span>
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
