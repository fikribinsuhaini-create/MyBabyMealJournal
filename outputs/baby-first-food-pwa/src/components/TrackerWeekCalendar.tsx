import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { days, weeks } from '../constants';
import type { FoodTracker } from '../types';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
import { shortAgeLabel, weekInfoForDate } from '../utils/trackerCalendar';
import { parseTrackerNotes } from '../utils/trackerMeta';
import { EmptyState, Pill } from './Ui';

const weekCellTone = ['bg-butter/70 text-cocoa', 'bg-sky/70 text-cocoa', 'bg-sage/45 text-cocoa', 'bg-peach/45 text-cocoa'];
const weekSwatchTone = ['bg-butter', 'bg-sky', 'bg-sage', 'bg-peach'];
const weekdayShort = days.map((day) => day.slice(0, 2));

function isoFromParts(year: number, month: number, day: number) {
  const monthPart = String(month + 1).padStart(2, '0');
  const dayPart = String(day).padStart(2, '0');
  return `${year}-${monthPart}-${dayPart}`;
}

function statusTone(status: string) {
  if (status === 'Alergi') return 'berry' as const;
  if (status === 'Perlu Dipantau') return 'butter' as const;
  return 'sage' as const;
}

export function TrackerWeekCalendar({
  birthDate,
  rows,
  onClose,
  onAddForDate,
}: {
  birthDate: string;
  rows: FoodTracker[];
  onClose: () => void;
  onAddForDate?: (iso: string) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthLabel = new Intl.DateTimeFormat('ms-MY', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth, 1));
  const todayInfo = birthDate ? weekInfoForDate(birthDate, todayIso()) : null;

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    const list: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < leadingBlanks; i += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) list.push({ day, iso: isoFromParts(viewYear, viewMonth, day) });
    return list;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
    } else {
      setViewMonth((month) => month - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
    } else {
      setViewMonth((month) => month + 1);
    }
  };

  const selectedEntries = useMemo(
    () => (selectedDate ? rows.filter((row) => toDateInputValue(row.introduced_date) === selectedDate) : []),
    [rows, selectedDate]
  );

  return (
    <div className="fixed inset-0 z-50 bg-cocoa/35 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[28px] bg-cream shadow-soft">
        <div className="flex items-center justify-between border-b border-white px-5 py-4">
          <h2 className="text-lg font-bold">Kalendar Rujukan Minggu</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!birthDate ? (
            <EmptyState text="Sila lengkapkan tarikh lahir bayi di Dashboard dahulu untuk guna kalendar rujukan ini." />
          ) : (
            <>
              {todayInfo ? (
                <div className="rounded-[18px] bg-sage/15 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-sageDeep">Hari ini</p>
                  <p className="mt-1 text-sm font-bold text-cocoa">
                    {todayInfo.ageCategory} • {todayInfo.week}
                  </p>
                </div>
              ) : (
                <div className="rounded-[18px] bg-butter/25 px-4 py-3 text-sm font-semibold text-cocoa/70">
                  Bayi belum masuk fasa pemakanan pepejal (bawah 6 bulan).
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {weeks.map((week, index) => (
                  <div key={week} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-cocoa/70 shadow-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${weekSwatchTone[index]}`} />
                    {week}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={goPrevMonth} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa shadow-sm" aria-label="Bulan sebelum">
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm font-bold capitalize text-cocoa">{monthLabel}</p>
                <button type="button" onClick={goNextMonth} className="grid h-9 w-9 place-items-center rounded-full bg-white text-cocoa shadow-sm" aria-label="Bulan seterusnya">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-cocoa/45">
                {weekdayShort.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, index) => {
                  if (!cell) return <div key={`blank-${index}`} />;
                  const info = weekInfoForDate(birthDate, cell.iso);
                  const isToday = cell.iso === todayIso();
                  const isSelected = cell.iso === selectedDate;
                  const hasLog = rows.some((row) => toDateInputValue(row.introduced_date) === cell.iso);
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => setSelectedDate(isSelected ? null : cell.iso)}
                      className={`relative flex h-14 flex-col items-center justify-center rounded-[14px] text-xs transition ${
                        info ? weekCellTone[info.weekIndex] : 'bg-white text-cocoa/35'
                      } ${isToday ? 'ring-2 ring-cocoa' : ''} ${isSelected ? 'outline outline-2 outline-offset-1 outline-berry' : ''}`}
                    >
                      <span className="text-sm font-bold">{cell.day}</span>
                      {info ? <span className="text-[10px] font-semibold opacity-80">{shortAgeLabel(info.ageCategory)}</span> : null}
                      {hasLog ? <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cocoa" /> : null}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs leading-relaxed text-cocoa/50">
                Warna = Minggu dalam bulan tu, label kecil (cth. "7bl") = umur bayi ikut bulan. Titik kecil = ada log. Tekan tarikh untuk tengok log hari tu.
              </p>

              {selectedDate ? (
                <div className="space-y-2 rounded-[18px] bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-cocoa">{formatDisplayDate(selectedDate)}</p>
                    <button type="button" onClick={() => setSelectedDate(null)} className="text-xs font-semibold text-cocoa/45">
                      Tutup
                    </button>
                  </div>

                  {onAddForDate ? (
                    <button
                      type="button"
                      onClick={() => onAddForDate(selectedDate)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-peach px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
                    >
                      <Plus size={15} />
                      Tambah log pada tarikh ini
                    </button>
                  ) : null}

                  {selectedEntries.length ? (
                    <div className="space-y-2">
                      {selectedEntries.map((row) => {
                        const meta = parseTrackerNotes(row.notes);
                        return (
                          <div key={row.id} className="rounded-[14px] bg-cream px-3 py-2">
                            <div className="mb-1 flex flex-wrap gap-1.5">
                              <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                              {meta.meal_time ? <Pill tone="sage">{meta.meal_time}</Pill> : null}
                            </div>
                            <p className="text-sm font-bold text-cocoa">{row.food_name}</p>
                            <p className="text-xs text-cocoa/55">{row.reaction}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-cocoa/50">Tiada log pada tarikh ini.</p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
