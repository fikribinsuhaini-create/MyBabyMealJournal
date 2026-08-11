import { useState } from 'react';
import { AppShell, type TabKey } from './components/AppShell';
import { useBabyFoodData } from './hooks/useBabyFoodData';
import { DashboardView } from './views/DashboardView';
import { GalleryView } from './views/GalleryView';
import { HistoryView } from './views/HistoryView';
import { MenuPlannerView } from './views/MenuPlannerView';
import { TrackerView } from './views/TrackerView';
import type { BabyProfile, FoodLibraryItem, FoodTracker, MenuIdea, Recipe } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [pendingTrackerCalendar, setPendingTrackerCalendar] = useState(false);
  const [pendingTrackerDate, setPendingTrackerDate] = useState<string | null>(null);
  const [pendingMissingPhotosFilter, setPendingMissingPhotosFilter] = useState(false);
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
  const upsertMenuIdea = async (row: MenuIdea) => {
    await upsert('MenuIdeas', row);
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

  const goToTrackerMissingPhotos = () => {
    setPendingMissingPhotosFilter(true);
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
          onGoToTracker={goToTrackerMissingPhotos}
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
          filterMissingPhotosOnMount={pendingMissingPhotosFilter}
          onFilterMissingPhotosConsumed={() => setPendingMissingPhotosFilter(false)}
        />
      ) : null}
      {activeTab === 'menu' ? (
        <MenuPlannerView
          rows={data.Recipes}
          upsert={upsertRecipe}
          remove={(id) => remove('Recipes', id)}
          ideaRows={data.MenuIdeas}
          upsertIdea={upsertMenuIdea}
          removeIdea={(id) => remove('MenuIdeas', id)}
        />
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
