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
  const [pendingTrackerCalendar, setPendingTrackerCalendar] = useState(false);
  const [pendingTrackerDate, setPendingTrackerDate] = useState<string | null>(null);
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

  const openTrackerCalendar = () => {
    setPendingTrackerCalendar(true);
    setActiveTab('tracker');
  };

  const addTrackerForDate = (iso: string) => {
    setPendingTrackerDate(iso);
    setActiveTab('tracker');
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? (
        <DashboardView
          data={data}
          upsert={upsertBabyProfile}
          onOpenTrackerCalendar={openTrackerCalendar}
          onAddTrackerForDate={addTrackerForDate}
        />
      ) : null}
      {activeTab === 'tracker' ? (
        <TrackerView
          rows={data.FoodTracker}
          menuRows={data.Recipes}
          babyProfile={data.BabyProfile[0]}
          upsert={upsertTracker}
          remove={(id) => remove('FoodTracker', id)}
          openCalendarOnMount={pendingTrackerCalendar}
          onOpenCalendarConsumed={() => setPendingTrackerCalendar(false)}
          openAddForDate={pendingTrackerDate}
          onOpenAddForDateConsumed={() => setPendingTrackerDate(null)}
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
