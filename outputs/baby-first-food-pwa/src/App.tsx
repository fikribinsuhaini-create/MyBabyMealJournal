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

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} syncState={syncState} syncMessage={syncMessage} data={data}>
      {activeTab === 'dashboard' ? <DashboardView data={data} upsert={(sheet, row: BabyProfile) => upsert(sheet, row)} /> : null}
      {activeTab === 'menu' ? <MenuView rows={data.MenuPlanner} upsert={(row: MenuPlanner) => upsert('MenuPlanner', row)} remove={(id) => remove('MenuPlanner', id)} /> : null}
      {activeTab === 'schedule' ? (
        <ScheduleView rows={data.FeedingSchedule} menuRows={data.MenuPlanner} upsert={(row: FeedingSchedule) => upsert('FeedingSchedule', row)} remove={(id) => remove('FeedingSchedule', id)} />
      ) : null}
      {activeTab === 'recipes' ? <RecipesView rows={data.Recipes} upsert={(row: Recipe) => upsert('Recipes', row)} remove={(id) => remove('Recipes', id)} /> : null}
      {activeTab === 'tracker' ? (
        <TrackerView rows={data.FoodTracker} menuRows={data.MenuPlanner} upsert={(row: FoodTracker) => upsert('FoodTracker', row)} remove={(id) => remove('FoodTracker', id)} />
      ) : null}
    </AppShell>
  );
}
