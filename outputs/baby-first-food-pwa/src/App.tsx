import { useState } from 'react';
import { AppShell, type TabKey } from './components/AppShell';
import { useBabyFoodData } from './hooks/useBabyFoodData';
import { DashboardView } from './views/DashboardView';
import { MenuView } from './views/MenuView';
import { RecipesView } from './views/RecipesView';
import { ScheduleView } from './views/ScheduleView';
import { TrackerView } from './views/TrackerView';
import type { BabyProfile, FeedingSchedule, FoodTracker, MenuPlanner, Recipe } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const { data, syncState, syncMessage, upsert, remove } = useBabyFoodData();
  const upsertBabyProfile = async (sheet: 'BabyProfile', row: BabyProfile) => {
    await upsert(sheet, row);
  };
  const upsertMenu = async (row: MenuPlanner) => {
    await upsert('MenuPlanner', row);
  };
  const upsertSchedule = async (row: FeedingSchedule) => {
    await upsert('FeedingSchedule', row);
  };
  const upsertRecipe = async (row: Recipe) => {
    await upsert('Recipes', row);
  };
  const upsertTracker = async (row: FoodTracker) => upsert('FoodTracker', row);

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? <DashboardView data={data} upsert={upsertBabyProfile} /> : null}
      {activeTab === 'menu' ? <MenuView rows={data.MenuPlanner} upsert={upsertMenu} remove={(id) => remove('MenuPlanner', id)} /> : null}
      {activeTab === 'schedule' ? (
        <ScheduleView rows={data.FeedingSchedule} menuRows={data.MenuPlanner} upsert={upsertSchedule} remove={(id) => remove('FeedingSchedule', id)} />
      ) : null}
      {activeTab === 'recipes' ? <RecipesView rows={data.Recipes} upsert={upsertRecipe} remove={(id) => remove('Recipes', id)} /> : null}
      {activeTab === 'tracker' ? (
        <TrackerView rows={data.FoodTracker} menuRows={data.MenuPlanner} upsert={upsertTracker} remove={(id) => remove('FoodTracker', id)} />
      ) : null}
    </AppShell>
  );
}
