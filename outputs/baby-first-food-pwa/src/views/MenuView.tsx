import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle, WeekTabs } from '../components/Ui';
import { days, mealTimes, reactions, weeks } from '../constants';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
import type { MenuPlanner } from '../types';

export function MenuView({
  rows,
  upsert,
  remove,
}: {
  rows: MenuPlanner[];
  upsert: (row: MenuPlanner) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [activeWeek, setActiveWeek] = useState(weeks[0]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MenuPlanner | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => row.week === activeWeek)
      .filter((row) => [row.day, row.menu, row.ingredients, row.reaction, row.notes].join(' ').toLowerCase().includes(query));
  }, [activeWeek, rows, search]);

  const activeRecord =
    editing ??
    (adding
      ? ({ week: activeWeek, date: todayIso(), day: days[0], meal_time: mealTimes[0], reaction: 'Belum Dinilai' } as Partial<MenuPlanner>)
      : null);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Menu Planner"
        title="Rancang 4 minggu"
        action={
          <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft">
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <WeekTabs weeks={weeks} active={activeWeek} setActive={setActiveWeek} />
      <SearchInput value={search} onChange={setSearch} placeholder="Cari menu, bahan, reaksi..." />

      <div className="space-y-3">
        {filtered.map((row) => (
          <Card key={row.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Pill tone="sage">{row.day}</Pill>
                  <Pill tone="butter">{formatDisplayDate(row.date)}</Pill>
                  <Pill tone="peach">{row.meal_time || 'Masa belum set'}</Pill>
                </div>
                <h3 className="text-lg font-bold">{row.menu}</h3>
              </div>
              <div className="flex gap-2">
                <IconButton label="Kemaskini" onClick={() => setEditing(row)}>
                  <Edit3 size={17} />
                </IconButton>
                <IconButton label="Padam" onClick={() => remove(row.id)} tone="danger">
                  <Trash2 size={17} />
                </IconButton>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-cocoa/70">Bahan: </span>
                {row.ingredients}
              </p>
              <p>
                <span className="font-semibold text-cocoa/70">Cara masak: </span>
                {row.cooking_method}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Pill tone={row.reaction.includes('Ada Reaksi') ? 'berry' : row.reaction === 'Belum Dinilai' ? 'butter' : 'peach'}>{row.reaction}</Pill>
                {row.notes ? <Pill tone="sage">{row.notes}</Pill> : null}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!filtered.length ? <EmptyState text="Tiada rekod menu untuk minggu ini." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Menu' : 'Tambah Menu'}
          fields={[
            { name: 'week', label: 'Minggu', type: 'select', options: weeks },
            { name: 'date', label: 'Tarikh', type: 'date' },
            { name: 'day', label: 'Hari', type: 'select', options: days },
            { name: 'meal_time', label: 'Masa Makan', type: 'select', options: mealTimes },
            { name: 'menu', label: 'Menu' },
            { name: 'ingredients', label: 'Bahan', type: 'textarea' },
            { name: 'cooking_method', label: 'Cara Masak', type: 'textarea' },
            { name: 'reaction', label: 'Reaksi Bayi', type: 'select', options: reactions },
            { name: 'notes', label: 'Nota', type: 'textarea' },
          ]}
          initialValues={{ ...(activeRecord as Record<string, string>), date: toDateInputValue(activeRecord.date || '') }}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSubmit={(values) => {
            upsert({ id: editing?.id ?? '', ...values } as MenuPlanner);
            setEditing(null);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}
