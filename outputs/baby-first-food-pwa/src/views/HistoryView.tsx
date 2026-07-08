import { useMemo } from 'react';
import { Card, EmptyState, Pill, SectionTitle } from '../components/Ui';
import type { FoodTracker } from '../types';
import { formatDisplayDate } from '../utils/date';

export function HistoryView({ rows }: { rows: FoodTracker[] }) {
  const historyByDay = useMemo(() => {
    const groups = rows
      .filter((row) => row.introduced_date && row.food_name)
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
  }, [rows]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Food History" title="Menu ikut hari" />

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
        <div className="space-y-3">
          {historyByDay.map((group) => (
            <Card key={group.date} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black leading-tight text-cocoa">Day {group.dayNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-cocoa/55">{formatDisplayDate(group.date)}</p>
                </div>
                <Pill tone="peach">{group.items.length} menu</Pill>
              </div>
              <p className="mt-3 break-words text-base font-bold leading-relaxed text-cocoa/80">{group.menuNames}</p>
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