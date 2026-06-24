import { useState } from 'react';
import { AppShell, type TabKey } from './components/AppShell';
import { useBabyFoodData } from './hooks/useBabyFoodData';
import { DashboardView } from './views/DashboardView';
import { GalleryView } from './views/GalleryView';
import { TrackerView } from './views/TrackerView';
import type { BabyProfile, FoodTracker } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { data, syncState, syncMessage, upsert, remove } = useBabyFoodData();
  const upsertBabyProfile = async (sheet: 'BabyProfile', row: BabyProfile) => {
    await upsert(sheet, row);
  };
  const upsertTracker = async (row: FoodTracker) => upsert('FoodTracker', row);
  const babyBirthDate = data.BabyProfile[0]?.birth_date ?? '';

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? <DashboardView data={data} upsert={upsertBabyProfile} /> : null}
      {activeTab === 'tracker' ? (
        <TrackerView rows={data.FoodTracker} upsert={upsertTracker} remove={(id) => remove('FoodTracker', id)} />
      ) : null}
      {activeTab === 'gallery' ? <GalleryView rows={data.FoodTracker} birthDate={babyBirthDate} /> : null}
    </AppShell>
  );
}
