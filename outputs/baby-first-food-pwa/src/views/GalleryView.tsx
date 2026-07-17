import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, EmptyState, Pill, SectionTitle } from '../components/Ui';
import type { FoodTracker } from '../types';
import { formatDisplayDate, getMonthsBetweenDates } from '../utils/date';

function buildAgeLabel(birthDate: string, entryDate: string) {
  const months = getMonthsBetweenDates(birthDate, entryDate);
  if (!birthDate) return 'Tanpa umur';
  if (months >= 12) return '12 Bulan Ke Atas';
  return `${Math.max(months, 0)} Bulan`;
}

type GalleryEntry = FoodTracker & { photoKey: string; imageUrl: string; ageLabel: string };

export function GalleryView({
  rows,
  birthDate,
}: {
  rows: FoodTracker[];
  birthDate: string;
}) {
  const [activeAge, setActiveAge] = useState('Semua');
  const [activeImage, setActiveImage] = useState<GalleryEntry | null>(null);

  const entries = useMemo(
    () =>
      rows
        .flatMap((row) =>
          (row.image_urls ?? []).map((imageUrl, index) => ({
            ...row,
            photoKey: `${row.id}-${index}`,
            imageUrl,
            ageLabel: buildAgeLabel(birthDate, row.introduced_date),
          }))
        )
        .sort((left, right) => {
          const leftTime = new Date(left.introduced_date).getTime();
          const rightTime = new Date(right.introduced_date).getTime();
          return rightTime - leftTime;
        }),
    [birthDate, rows]
  );

  const ageFilters = useMemo(() => ['Semua', ...Array.from(new Set(entries.map((row) => row.ageLabel)))], [entries]);

  const filteredEntries = useMemo(
    () => entries.filter((row) => activeAge === 'Semua' || row.ageLabel === activeAge),
    [activeAge, entries]
  );

  const dateGroups = useMemo(() => {
    const groups: { date: string; ageLabel: string; entries: GalleryEntry[] }[] = [];
    filteredEntries.forEach((entry) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === entry.introduced_date) {
        lastGroup.entries.push(entry);
      } else {
        groups.push({ date: entry.introduced_date, ageLabel: entry.ageLabel, entries: [entry] });
      }
    });
    return groups;
  }, [filteredEntries]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Journey" title="Gallery bayi" />

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

      {dateGroups.length ? (
        <div className="space-y-5">
          {dateGroups.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-cocoa/70">{formatDisplayDate(group.date)}</p>
                <Pill tone="sage">{group.ageLabel}</Pill>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {group.entries.map((row) => (
                  <button
                    key={row.photoKey}
                    type="button"
                    onClick={() => setActiveImage(row)}
                    className="overflow-hidden rounded-[24px] bg-white text-left shadow-soft"
                  >
                    <img src={row.imageUrl} alt={row.food_name} className="h-40 w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState text="Belum ada gambar dalam tracker." />
        </Card>
      )}

      {activeImage ? (
        <div className="fixed inset-0 z-50 bg-cocoa/75 px-4 py-5 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-md flex-col justify-center">
            <div className="overflow-hidden rounded-[30px] bg-cream shadow-soft">
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <Pill tone="sage">{buildAgeLabel(birthDate, activeImage.introduced_date)}</Pill>
                  <p className="mt-2 text-sm font-semibold text-cocoa/75">{formatDisplayDate(activeImage.introduced_date)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa"
                  aria-label="Tutup gambar"
                >
                  <X size={18} />
                </button>
              </div>
              <img src={activeImage.imageUrl} alt={activeImage.food_name} className="max-h-[70vh] w-full bg-white object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

