import { ChevronDown, ChevronUp, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
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
  const [activeAge, setActiveAge] = useState(ageCategories[0]);
  const [search, setSearch] = useState('');
  const [openWeek, setOpenWeek] = useState(weeks[0]);
  const [editing, setEditing] = useState<MenuPlanner | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => row.age_category === activeAge)
      .filter((row) => [row.week, row.age_category, row.day, row.menu, row.snack].join(' ').toLowerCase().includes(query))
      .sort((left, right) => {
        const weekCompare = weeks.indexOf(left.week) - weeks.indexOf(right.week);
        if (weekCompare !== 0) return weekCompare;
        return getDayNumber(left.day) - getDayNumber(right.day);
      });
  }, [activeAge, rows, search]);

  const groupedByWeek = useMemo(
    () =>
      weeks
        .map((week) => ({
          week,
          items: filtered.filter((row) => row.week === week),
        }))
        .filter((group) => group.items.length > 0),
    [filtered]
  );

  useEffect(() => {
    setOpenWeek(groupedByWeek[0]?.week ?? weeks[0]);
  }, [activeAge, groupedByWeek]);

  const activeRecord = editing ?? (adding ? ({ week: activeWeekFromList(groupedByWeek), age_category: activeAge, day: menuDays[0] } as Partial<MenuPlanner>) : null);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Menu Planner"
        title="Rancang ikut umur"
        action={
          <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft">
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ageCategories.map((ageCategory) => (
          <button
            key={ageCategory}
            type="button"
            onClick={() => setActiveAge(ageCategory)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeAge === ageCategory ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
            }`}
          >
            {ageCategory}
          </button>
        ))}
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Cari Day 1, Bubur..." />

      <div className="space-y-3">
        {groupedByWeek.map(({ week, items }) => {
          const isOpen = openWeek === week;

          return (
            <Card key={week} className={`overflow-hidden border-l-4 ${ageTone(activeAge)}`}>
              <button
                type="button"
                onClick={() => setOpenWeek(isOpen ? '' : week)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <Pill tone="sage">{week}</Pill>
                  <h3 className="mt-2 text-lg font-bold">{activeAge}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-cocoa/55">{items.length} menu</p>
                  {isOpen ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                </div>
              </button>

              {isOpen ? (
                <div className="mt-4 space-y-2 border-t border-oat/60 pt-4">
                  {items.map((row) => (
                    <div key={row.id} className="flex items-start gap-3 rounded-[20px] bg-cream px-3 py-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white text-center shadow-sm">
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-cocoa/45">Day</span>
                        <span className="text-base font-bold leading-none text-cocoa">{getDayNumber(row.day)}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cocoa/50">{row.day}</p>
                        <p className="mt-1 break-words text-base font-bold leading-tight text-cocoa">{row.menu}</p>
                        {row.snack ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-sage/18 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sageDeep">Snek</span>
                            <p className="text-sm font-semibold text-cocoa/70">{row.snack}</p>
                          </div>
                        ) : null}
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
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {!groupedByWeek.length ? <EmptyState text="Tiada rekod menu untuk umur ini." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Menu' : 'Tambah Menu'}
          fields={[
            { name: 'week', label: 'Minggu', type: 'select', options: weeks },
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'day', label: 'Hari', type: 'select', options: menuDays },
            { name: 'menu', label: 'Menu / Makanan' },
            { name: 'snack', label: 'Snek / Extra', placeholder: 'Contoh: Buah potong' },
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

function activeWeekFromList(groupedByWeek: Array<{ week: string }>) {
  return groupedByWeek[0]?.week ?? weeks[0];
}
