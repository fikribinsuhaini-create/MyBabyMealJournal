import { useState } from 'react';
import { AppShell, type TabKey } from './components/AppShell';
import { useBabyFoodData } from './hooks/useBabyFoodData';
import { DashboardView } from './views/DashboardView';
import { GalleryView } from './views/GalleryView';
import { HistoryView } from './views/HistoryView';
import { MenuPlannerView } from './views/MenuPlannerView';
import { TrackerView } from './views/TrackerView';
import type { BabyProfile, FoodLibraryItem, FoodTracker, Recipe } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [pendingTrackerAdd, setPendingTrackerAdd] = useState(false);
  const [pendingTrackerCalendar, setPendingTrackerCalendar] = useState(false);
  const { data, syncState, syncMessage, upsert, remove } = useBabyFoodData();
  const upsertBabyProfile = async (sheet: 'BabyProfile', row: BabyProfile) => {
    await upsert(sheet, row);
  };
  const upsertTracker = async (row: FoodTracker) => upsert('FoodTracker', row);
  const upsertRecipe = async (row: Recipe) => {
    await upsert('Recipes', row);
  };
  const upsertLibraryItem = async (row: FoodLibraryItem) => {
    await upsert('FoodLibrary', row);
  };
  const babyBirthDate = data.BabyProfile[0]?.birth_date ?? '';

  const quickAddTracker = () => {
    setPendingTrackerAdd(true);
    setActiveTab('tracker');
  };

  const openTrackerCalendar = () => {
    setPendingTrackerCalendar(true);
    setActiveTab('tracker');
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? (
        <DashboardView data={data} upsert={upsertBabyProfile} onQuickAddTracker={quickAddTracker} onOpenTrackerCalendar={openTrackerCalendar} />
      ) : null}
      {activeTab === 'tracker' ? (
        <TrackerView
          rows={data.FoodTracker}
          menuRows={data.Recipes}
          babyProfile={data.BabyProfile[0]}
          upsert={upsertTracker}
          remove={(id) => remove('FoodTracker', id)}
          openAddOnMount={pendingTrackerAdd}
          onOpenAddConsumed={() => setPendingTrackerAdd(false)}
          openCalendarOnMount={pendingTrackerCalendar}
          onOpenCalendarConsumed={() => setPendingTrackerCalendar(false)}
        />
      ) : null}
      {activeTab === 'menu' ? (
        <MenuPlannerView rows={data.Recipes} upsert={upsertRecipe} remove={(id) => remove('Recipes', id)} />
      ) : null}
      {activeTab === 'history' ? (
        <HistoryView
          rows={data.FoodTracker}
          libraryRows={data.FoodLibrary}
          upsertLibraryItem={upsertLibraryItem}
          removeLibraryItem={(id) => remove('FoodLibrary', id)}
        />
      ) : null}
      {activeTab === 'gallery' ? <GalleryView rows={data.FoodTracker} birthDate={babyBirthDate} /> : null}
    </AppShell>
  );
}
