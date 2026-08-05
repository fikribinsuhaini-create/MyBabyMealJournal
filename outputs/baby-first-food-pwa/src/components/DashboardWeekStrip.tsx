import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FoodTracker } from '../types';
import { addDaysIso, formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
import { Pill } from './Ui';

function weekdayShortLabel(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('ms-MY', { weekday: 'short' }).format(parsed);
}

function statusTone(status: string) {
  if (status === 'Alergi') return 'berry' as const;
  if (status === 'Perlu Dipantau') return 'butter' as const;
  return 'sage' as const;
}

export function DashboardWeekStrip({
  rows,
  onAddForDate,
  onOpenFullCalendar,
}: {
  rows: FoodTracker[];
  onAddForDate: (iso: string) => void;
  onOpenFullCalendar?: () => void;
}) {
  const today = useMemo(() => todayIso(), []);
  const [selectedDate, setSelectedDate] = useState(today);

  const strip = useMemo(() => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    return offsets.map((offset) => {
      const iso = addDaysIso(today, offset);
      return {
        iso,
        day: Number(iso.slice(-2)),
        weekday: weekdayShortLabel(iso),
        hasLog: rows.some((row) => toDateInputValue(row.introduced_date) === iso),
      };
    });
  }, [rows, today]);

  const selectedEntries = useMemo(
    () => rows.filter((row) => toDateInputValue(row.introduced_date) === selectedDate),
    [rows, selectedDate]
  );

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sageDeep">Minggu ini</p>
        {onOpenFullCalendar ? (
          <button type="button" onClick={onOpenFullCalendar} className="text-xs font-semibold text-cocoa/50">
            Kalendar penuh
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {strip.map((cell) => {
          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === today;
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelectedDate(cell.iso)}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] text-xs transition ${
                isSelected ? 'bg-peach text-white shadow-sm' : 'bg-cream text-cocoa'
              } ${isToday && !isSelected ? 'ring-2 ring-cocoa/40' : ''}`}
            >
              <span className="text-[10px] font-semibold uppercase opacity-75">{cell.weekday}</span>
              <span className="text-sm font-bold">{cell.day}</span>
              {cell.hasLog ? (
                <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-peach'}`} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2 rounded-[18px] bg-cream px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-cocoa">{formatDisplayDate(selectedDate)}</p>
          <button
            type="button"
            onClick={() => onAddForDate(selectedDate)}
            className="flex items-center gap-1 rounded-full bg-peach px-3 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95"
          >
            <Plus size={14} />
            Tambah log
          </button>
        </div>

        {selectedEntries.length ? (
          <div className="space-y-2">
            {selectedEntries.map((row) => (
              <div key={row.id} className="rounded-[14px] bg-white px-3 py-2">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                </div>
                <p className="text-sm font-bold text-cocoa">{row.food_name}</p>
                <p className="text-xs text-cocoa/55">{row.reaction}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-cocoa/50">Tiada log pada tarikh ini.</p>
        )}
      </div>
    </div>
  );
}
