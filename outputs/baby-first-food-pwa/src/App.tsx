import { useState } from 'react';
import { AppShell, type TabKey } from './components/AppShell';
import { useBabyFoodData } from './hooks/useBabyFoodData';
import { DashboardView } from './views/DashboardView';
import { GalleryView } from './views/GalleryView';
import { HistoryView } from './views/HistoryView';
import { MenuPlannerView } from './views/MenuPlannerView';
import { TrackerView } from './views/TrackerView';
import type { BabyProfile, FoodTracker, Recipe } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [pendingTrackerAdd, setPendingTrackerAdd] = useState(false);
  const { data, syncState, syncMessage, upsert, remove } = useBabyFoodData();
  const upsertBabyProfile = async (sheet: 'BabyProfile', row: BabyProfile) => {
    await upsert(sheet, row);
  };
  const upsertTracker = async (row: FoodTracker) => upsert('FoodTracker', row);
  const upsertRecipe = async (row: Recipe) => {
    await upsert('Recipes', row);
  };
  const babyBirthDate = data.BabyProfile[0]?.birth_date ?? '';

  const quickAddTracker = () => {
    setPendingTrackerAdd(true);
    setActiveTab('tracker');
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? <DashboardView data={data} upsert={upsertBabyProfile} onQuickAddTracker={quickAddTracker} /> : null}
      {activeTab === 'tracker' ? (
        <TrackerView
          rows={data.FoodTracker}
          menuRows={data.Recipes}
          upsert={upsertTracker}
          remove={(id) => remove('FoodTracker', id)}
          openAddOnMount={pendingTrackerAdd}
          onOpenAddConsumed={() => setPendingTrackerAdd(false)}
        />
      ) : null}
      {activeTab === 'menu' ? (
        <MenuPlannerView rows={data.Recipes} upsert={upsertRecipe} remove={(id) => remove('Recipes', id)} />
      ) : null}
      {activeTab === 'history' ? <HistoryView rows={data.FoodTracker} /> : null}
      {activeTab === 'gallery' ? <GalleryView rows={data.FoodTracker} birthDate={babyBirthDate} /> : null}
    </AppShell>
  );
}
