import { ChevronDown, ChevronUp, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
import { ageCategories, weeks } from '../constants';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
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

function dayLabel(day: string) {
  const match = day.match(/\d+/);
  return match ? `Day ${match[0]}` : day;
}

function weekdayFromDate(dateValue: string) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('ms-MY', { weekday: 'long' }).format(parsed);
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
  const [openDay, setOpenDay] = useState('');
  const [editing, setEditing] = useState<MenuPlanner | null>(null);
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<Partial<MenuPlanner> | null>(null);
  const [dateEditor, setDateEditor] = useState<{ week: string; day: string; date: string; items: MenuPlanner[] } | null>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => row.age_category === activeAge)
      .filter((row) => [row.week, row.age_category, row.date, row.day, row.menu].join(' ').toLowerCase().includes(query))
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

  useEffect(() => {
    setOpenDay('');
  }, [activeAge, openWeek]);

  const activeRecord =
    editing ??
    (adding
      ? prefill ?? ({ week: activeWeekFromList(groupedByWeek), age_category: activeAge, date: todayIso(), day: menuDays[0] } as Partial<MenuPlanner>)
      : null);

  const activeDate = activeRecord?.date || todayIso();

  const groupedWeekWithDays = useMemo(
    () =>
      groupedByWeek.map(({ week, items }) => {
        const dayGroups = menuDays
          .map((day) => ({
            day,
            items: items.filter((row) => row.day === day),
          }))
          .filter((group) => group.items.length > 0);

        return { week, dayGroups };
      }),
    [groupedByWeek]
  );

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Menu Planner"
        title="Rancang ikut umur"
        action={
          <button
            type="button"
            onClick={() => {
              setPrefill(null);
              setAdding(true);
            }}
            className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft"
          >
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
        {groupedWeekWithDays.map(({ week, dayGroups }) => {
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
                  <p className="text-xs font-semibold text-cocoa/55">{dayGroups.reduce((count, group) => count + group.items.length, 0)} menu</p>
                  {isOpen ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                </div>
              </button>

              {isOpen ? (
                <div className="mt-4 space-y-2 border-t border-oat/60 pt-4">
                  {dayGroups.map(({ day, items }) => {
                    const dayKey = `${week}-${day}`;
                    const isDayOpen = openDay === dayKey;
                    const dayDate = items[0]?.date || todayIso();
                    const dayDateLabel = items[0]?.date ? `${formatDisplayDate(items[0].date)}${weekdayFromDate(items[0].date) ? ` • ${weekdayFromDate(items[0].date)}` : ''}` : 'Tarikh belum set';

                    return (
                      <Card key={day} className="overflow-hidden bg-cream p-0">
                        <div className="flex items-center justify-between gap-3 px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setOpenDay(isDayOpen ? '' : dayKey)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="text-xl font-black leading-tight text-cocoa">{dayLabel(day)}</p>
                            <p className="mt-1 text-[11px] font-semibold text-cocoa/55">{dayDateLabel}</p>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPrefill({
                                  week,
                                  age_category: activeAge,
                                  date: dayDate,
                                  day,
                                  menu: '',
                                });
                                setAdding(true);
                              }}
                              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-cocoa shadow-sm"
                            >
                              + Item
                            </button>
                            <button
                              type="button"
                              onClick={() => setDateEditor({ week, day, date: items[0]?.date || dayDate, items })}
                              className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-sageDeep shadow-sm"
                            >
                              Tarikh
                            </button>
                            <p className="text-xs font-semibold text-cocoa/55">{items.length} item</p>
                            <button
                              type="button"
                              onClick={() => setOpenDay(isDayOpen ? '' : dayKey)}
                              className="grid h-8 w-8 place-items-center rounded-full bg-white text-cocoa shadow-sm"
                              aria-label={isDayOpen ? 'Tutup' : 'Buka'}
                            >
                              {isDayOpen ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                            </button>
                          </div>
                        </div>

                        {isDayOpen ? (
                          <div className="space-y-2 border-t border-oat/60 px-4 py-4">
                            {items.map((row, index) => (
                              <div key={row.id} className="flex items-start gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-sm font-bold leading-tight text-cocoa">{row.menu}</p>
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
          ]}
          initialValues={activeRecord as Record<string, string>}
          onClose={() => {
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
          onSubmit={(values) => {
            upsert({ id: editing?.id ?? '', ...(activeRecord as Record<string, string>), ...values, date: activeDate } as MenuPlanner);
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
        />
      ) : null}

      {dateEditor ? (
        <FormModal
          title={`Tarikh ${dateEditor.day}`}
          fields={[{ name: 'date', label: 'Tarikh', type: 'date' }]}
          initialValues={{ date: toDateInputValue(dateEditor.date) }}
          onClose={() => setDateEditor(null)}
          onSubmit={({ date }) => {
            const nextDate = date || todayIso();
            setDateEditor(null);
            void Promise.all(
              dateEditor.items.map((row) =>
                upsert({
                  ...row,
                  date: nextDate,
                })
              )
            );
          }}
        />
      ) : null}
    </div>
  );
}

function activeWeekFromList(groupedByWeek: Array<{ week: string }>) {
  return groupedByWeek[0]?.week ?? weeks[0];
}
