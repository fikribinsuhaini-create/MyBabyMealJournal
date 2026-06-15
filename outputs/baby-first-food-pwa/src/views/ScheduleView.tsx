import { ChevronDown, ChevronUp, Edit3, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SectionTitle } from '../components/Ui';
import { ageCategories, weeks } from '../constants';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
import type { FeedingSchedule, MenuPlanner } from '../types';

const meals = [
  ['Sarapan', 'breakfast'],
  ['Tengah Hari', 'lunch'],
  ['Petang', 'evening'],
  ['Malam', 'dinner'],
] as const;

function dayFromDate(dateValue: string) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('ms-MY', { weekday: 'long' }).format(parsed);
}

function weekNumber(week: string) {
  const match = week.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function ageTone(ageCategory: string) {
  if (ageCategory === '6 Bulan') return 'bg-peach/20 text-peachDeep';
  if (ageCategory === '7 Bulan' || ageCategory === '8 Bulan') return 'bg-sage/20 text-sageDeep';
  if (ageCategory === '9 Bulan' || ageCategory === '10 Bulan') return 'bg-butter/35 text-cocoa';
  return 'bg-white/80 text-cocoa';
}

export function ScheduleView({
  rows,
  menuRows,
  upsert,
  remove,
}: {
  rows: FeedingSchedule[];
  menuRows: MenuPlanner[];
  upsert: (row: FeedingSchedule) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [activeAge, setActiveAge] = useState(ageCategories[0]);
  const [openWeek, setOpenWeek] = useState(weeks[0]);
  const [openRowId, setOpenRowId] = useState('');
  const [editing, setEditing] = useState<FeedingSchedule | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(
    () =>
      rows
        .filter((row) => {
          if (row.age_category) return row.age_category === activeAge;
          return activeAge === ageCategories[0];
        })
        .sort((left, right) => {
          const leftWeek = weekNumber(left.week);
          const rightWeek = weekNumber(right.week);
          if (leftWeek !== rightWeek) return leftWeek - rightWeek;
          return new Date(left.date).getTime() - new Date(right.date).getTime();
        }),
    [activeAge, rows]
  );

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

  const activeRecord = editing ?? (adding ? ({ week: openWeek, age_category: activeAge, date: todayIso() } as Partial<FeedingSchedule>) : null);

  const menuOptions = useMemo(() => {
    const base = ['-'];
    const plannedMenus = menuRows
      .filter((row) => row.age_category === activeAge)
      .filter((row) => row.week === openWeek)
      .map((row) => `${row.age_category} - ${row.menu}`)
      .filter(Boolean);
    const currentValues = activeRecord
      ? [activeRecord.breakfast, activeRecord.lunch, activeRecord.evening, activeRecord.dinner].filter((value): value is string => Boolean(value))
      : [];
    return Array.from(new Set([...base, ...plannedMenus, ...currentValues]));
  }, [activeAge, activeRecord, menuRows, openWeek]);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Jadual Makan"
        title="Rutin ikut umur"
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
                  <p className="text-xs font-semibold text-cocoa/55">{items.length} jadual</p>
                  {isOpen ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                </div>
              </button>

              {isOpen ? (
                <div className="mt-4 space-y-2 border-t border-oat/60 pt-4">
                  {items.map((row) => (
                    <Card key={row.id} className="overflow-hidden bg-cream p-0">
                      <button
                        type="button"
                        onClick={() => setOpenRowId(openRowId === row.id ? '' : row.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Pill tone="sage">{row.day || dayFromDate(row.date) || 'Hari'}</Pill>
                            <Pill tone="butter">{formatDisplayDate(row.date)}</Pill>
                          </div>
                          <p className="text-xs font-semibold text-cocoa/55">Tap untuk buka detail</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-cocoa/70">
                            {row.breakfast || row.lunch || row.evening || row.dinner ? 'Ada menu' : 'Kosong'}
                          </div>
                          {openRowId === row.id ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                        </div>
                      </button>

                      {openRowId === row.id ? (
                        <div className="space-y-2 border-t border-oat/60 px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <IconButton label="Kemaskini" onClick={() => setEditing(row)}>
                              <Edit3 size={17} />
                            </IconButton>
                            <IconButton label="Padam" onClick={() => remove(row.id)} tone="danger">
                              <Trash2 size={17} />
                            </IconButton>
                          </div>

                          <div className="grid gap-2">
                            {meals.map(([label, key]) => (
                              <div key={key} className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                                <span className="text-sm font-semibold text-cocoa/70">{label}</span>
                                <span className="max-w-[56%] text-right text-sm font-bold">{row[key] || '-'}</span>
                              </div>
                            ))}
                          </div>

                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {!groupedByWeek.length ? <EmptyState text="Tiada jadual untuk umur ini." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Jadual' : 'Tambah Jadual'}
          fields={[
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'week', label: 'Minggu', type: 'select', options: weeks },
            { name: 'date', label: 'Tarikh', type: 'date' },
            { name: 'breakfast', label: 'Sarapan', type: 'select', options: menuOptions },
            { name: 'lunch', label: 'Tengah Hari', type: 'select', options: menuOptions },
            { name: 'evening', label: 'Petang', type: 'select', options: menuOptions },
            { name: 'dinner', label: 'Malam', type: 'select', options: menuOptions },
          ]}
          initialValues={{ ...(activeRecord as Record<string, string>), date: toDateInputValue(activeRecord.date || '') }}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSubmit={(values) => {
            upsert({
              id: editing?.id ?? '',
              ...values,
              day: dayFromDate(values.date),
            } as FeedingSchedule);
            setEditing(null);
            setAdding(false);
            setOpenRowId('');
          }}
        />
      ) : null}
    </div>
  );
}
