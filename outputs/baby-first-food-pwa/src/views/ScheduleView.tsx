import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SectionTitle, WeekTabs } from '../components/Ui';
import { weeks } from '../constants';
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
  const [activeWeek, setActiveWeek] = useState(weeks[0]);
  const [editing, setEditing] = useState<FeedingSchedule | null>(null);
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => rows.filter((row) => row.week === activeWeek), [activeWeek, rows]);
  const activeRecord = editing ?? (adding ? ({ week: activeWeek, date: todayIso() } as Partial<FeedingSchedule>) : null);
  const menuOptions = useMemo(() => {
    const base = ['-'];
    const plannedMenus = menuRows.filter((row) => row.week === activeWeek).map((row) => row.menu).filter(Boolean);
    const currentValues = activeRecord
      ? [activeRecord.breakfast, activeRecord.lunch, activeRecord.evening, activeRecord.dinner].filter((value): value is string => Boolean(value))
      : [];
    return Array.from(new Set([...base, ...plannedMenus, ...currentValues]));
  }, [activeRecord, activeWeek, menuRows]);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Jadual Makan"
        title="Rutin harian"
        action={
          <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft">
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <WeekTabs weeks={weeks} active={activeWeek} setActive={setActiveWeek} />

      <div className="space-y-3">
        {filtered.map((row) => (
          <Card key={row.id}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Pill tone="sage">{row.day || dayFromDate(row.date) || 'Hari'}</Pill>
                <Pill tone="butter">{formatDisplayDate(row.date)}</Pill>
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
            <div className="grid gap-2">
              {meals.map(([label, key]) => (
                <div key={key} className="flex items-center justify-between rounded-[18px] bg-cream px-4 py-3">
                  <span className="text-sm font-semibold text-cocoa/70">{label}</span>
                  <span className="max-w-[56%] text-right text-sm font-bold">{row[key] || '-'}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {!filtered.length ? <EmptyState text="Tiada jadual untuk minggu ini." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Jadual' : 'Tambah Jadual'}
          fields={[
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
          }}
        />
      ) : null}
    </div>
  );
}
