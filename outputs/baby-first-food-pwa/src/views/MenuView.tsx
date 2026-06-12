import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle, WeekTabs } from '../components/Ui';
import { ageCategories, weeks } from '../constants';
import type { MenuPlanner } from '../types';

const menuDays = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

function getDayNumber(day: string) {
  const match = day.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function ageTone(ageCategory: string) {
  if (ageCategory === '6 Bulan') return 'bg-peach/20 text-peachDeep';
  if (ageCategory === '7 Bulan' || ageCategory === '8 Bulan') return 'bg-sage/20 text-sageDeep';
  if (ageCategory === '9 Bulan' || ageCategory === '10 Bulan') return 'bg-butter/35 text-cocoa';
  return 'bg-white/80 text-cocoa';
}

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
      .filter((row) => [row.week, row.age_category, row.day, row.menu].join(' ').toLowerCase().includes(query))
      .sort((left, right) => getDayNumber(left.day) - getDayNumber(right.day));
  }, [activeWeek, rows, search]);

  const activeRecord = editing ?? (adding ? ({ week: activeWeek, age_category: ageCategories[0], day: menuDays[0] } as Partial<MenuPlanner>) : null);

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
      <SearchInput value={search} onChange={setSearch} placeholder="Cari Day 1, Bubur..." />

      <div className="space-y-3">
        {filtered.map((row) => (
          <Card key={row.id} className={`border-l-4 ${row.age_category === '6 Bulan' ? 'border-l-peach' : row.age_category === '7 Bulan' || row.age_category === '8 Bulan' ? 'border-l-sage' : 'border-l-butter'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Pill tone="sage">{row.week}</Pill>
                  <Pill tone="butter">{row.day}</Pill>
                  <Pill tone="peach">{row.age_category}</Pill>
                </div>
                <div className="flex items-start gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-cream text-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cocoa/50">Day</span>
                    <span className="text-lg font-bold leading-none text-cocoa">{getDayNumber(row.day)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cocoa/55">Menu</p>
                    <h3 className="mt-1 break-words text-lg font-bold leading-tight">{row.menu}</h3>
                  </div>
                </div>
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
          </Card>
        ))}
      </div>

      {!filtered.length ? <EmptyState text="Tiada rekod menu untuk minggu ini." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Menu' : 'Tambah Menu'}
          fields={[
            { name: 'week', label: 'Minggu', type: 'select', options: weeks },
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'day', label: 'Hari', type: 'select', options: menuDays },
            { name: 'menu', label: 'Menu / Makanan' },
          ]}
          initialValues={activeRecord as Record<string, string>}
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
