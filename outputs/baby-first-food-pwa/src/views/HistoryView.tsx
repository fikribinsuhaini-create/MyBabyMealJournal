import { useMemo, useState } from 'react';
import { Card, EmptyState, Pill, SectionTitle } from '../components/Ui';
import { ageCategories } from '../constants';
import type { FoodTracker } from '../types';
import { formatDisplayDate } from '../utils/date';

const META_START = '[[baby-food-meta:';
const META_END = ']]';

function trackerAge(row: FoodTracker) {
  const notes = row.notes || '';
  if (!notes.startsWith(META_START)) return 'Umur belum set';

  const closeIndex = notes.indexOf(META_END);
  if (closeIndex === -1) return 'Umur belum set';

  try {
    const rawMeta = notes.slice(META_START.length, closeIndex);
    const meta = JSON.parse(rawMeta) as Partial<Record<'age_category', string>>;
    return meta.age_category || 'Umur belum set';
  } catch {
    return 'Umur belum set';
  }
}

export function HistoryView({ rows }: { rows: FoodTracker[] }) {
  const [activeAge, setActiveAge] = useState('Semua');

  const ageFilters = useMemo(() => {
    const availableAges = ageCategories.filter((ageCategory) => rows.some((row) => trackerAge(row) === ageCategory));
    const hasUnsetAge = rows.some((row) => trackerAge(row) === 'Umur belum set');
    return ['Semua', ...availableAges, ...(hasUnsetAge ? ['Umur belum set'] : [])];
  }, [rows]);

  const historyByDay = useMemo(() => {
    const groups = rows
      .filter((row) => row.introduced_date && row.food_name)
      .filter((row) => activeAge === 'Semua' || trackerAge(row) === activeAge)
      .reduce<Array<{ date: string; items: FoodTracker[] }>>((accumulator, row) => {
        const existing = accumulator.find((group) => group.date === row.introduced_date);
        if (existing) {
          existing.items.push(row);
          return accumulator;
        }

        accumulator.push({ date: row.introduced_date, items: [row] });
        return accumulator;
      }, [])
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

    return groups.map((group, index) => ({
      ...group,
      dayNumber: index + 1,
      menuNames: group.items.map((item) => item.food_name).join(', '),
    }));
  }, [activeAge, rows]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Food History" title="Menu ikut hari" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ageFilters.map((ageLabel) => (
          <button
            key={ageLabel}
            type="button"
            onClick={() => setActiveAge(ageLabel)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeAge === ageLabel ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
            }`}
          >
            {ageLabel}
          </button>
        ))}
      </div>

      <Card className="space-y-3 bg-sage/12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sageDeep">Ringkasan</p>
            <h3 className="mt-1 text-lg font-bold text-cocoa">Apa baby sudah makan</h3>
            <p className="mt-1 text-sm leading-relaxed text-cocoa/65">Susun ikut hari supaya senang nampak menu yang sudah cuba.</p>
          </div>
          <Pill tone="sage">{historyByDay.length} hari</Pill>
        </div>
      </Card>

      {historyByDay.length ? (
        <div className="space-y-2">
          {historyByDay.map((group) => (
            <Card key={group.date} className="p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-base font-black leading-tight text-cocoa">Day {group.dayNumber}</p>
                <span className="text-sm font-bold text-cocoa/35">.</span>
                <p className="text-sm font-semibold text-cocoa/55">{formatDisplayDate(group.date)}</p>
              </div>
              <p className="mt-2 break-words text-base font-bold leading-relaxed text-cocoa/82">{group.menuNames}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState text="Belum ada food history." />
        </Card>
      )}
    </div>
  );
}