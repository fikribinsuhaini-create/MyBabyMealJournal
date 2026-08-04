import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
import { ageCategories, foodCategories } from '../constants';
import type { FoodLibraryItem, FoodTracker } from '../types';
import { formatDisplayDate } from '../utils/date';
import { parseTrackerNotes } from '../utils/trackerMeta';

function trackerAge(row: FoodTracker) {
  return parseTrackerNotes(row.notes).age_category || 'Umur belum set';
}

export function HistoryView({
  rows,
  libraryRows,
  upsertLibraryItem,
  removeLibraryItem,
}: {
  rows: FoodTracker[];
  libraryRows: FoodLibraryItem[];
  upsertLibraryItem: (row: FoodLibraryItem) => Promise<void>;
  removeLibraryItem: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'hari' | 'kategori'>('hari');
  const [activeAge, setActiveAge] = useState('Semua');
  const [addingFood, setAddingFood] = useState(false);
  const [hariSearch, setHariSearch] = useState('');
  const [kategoriSearch, setKategoriSearch] = useState('');

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

  const filteredHistoryByDay = useMemo(() => {
    const query = hariSearch.trim().toLowerCase();
    if (!query) return historyByDay;
    return historyByDay.filter(
      (group) =>
        group.menuNames.toLowerCase().includes(query) ||
        formatDisplayDate(group.date).toLowerCase().includes(query) ||
        `day ${group.dayNumber}`.includes(query)
    );
  }, [hariSearch, historyByDay]);

  const libraryByCategory = useMemo(() => {
    const query = kategoriSearch.trim().toLowerCase();
    return foodCategories
      .map((category) => {
        const items = [...libraryRows.filter((item) => item.category === category)]
          .filter((item) => !query || item.food_name.toLowerCase().includes(query))
          .sort((left, right) => Number(left.tried_status === 'Sudah Cuba') - Number(right.tried_status === 'Sudah Cuba'));
        const untriedCount = items.filter((item) => item.tried_status !== 'Sudah Cuba').length;
        return { category, items, untriedCount };
      })
      .filter((group) => group.items.length > 0);
  }, [kategoriSearch, libraryRows]);

  const totalUntried = useMemo(() => libraryRows.filter((item) => item.tried_status !== 'Sudah Cuba').length, [libraryRows]);

  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Food History" title={mode === 'hari' ? 'Menu ikut hari' : 'Senarai makanan'} />

      <div className="flex gap-2">
        {(
          [
            { key: 'hari', label: 'Ikut Hari' },
            { key: 'kategori', label: 'Senarai Makanan' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`relative h-11 flex-1 rounded-full text-sm font-semibold transition ${
              mode === tab.key ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
            }`}
          >
            {tab.label}
            {tab.key === 'kategori' && totalUntried > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-berry px-1 text-[11px] font-bold text-white shadow-sm">
                {totalUntried}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === 'hari' ? (
        <>
          <SearchInput value={hariSearch} onChange={setHariSearch} placeholder="Cari hari, tarikh, atau menu..." />

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

          {filteredHistoryByDay.length ? (
            <div className="space-y-2">
              {filteredHistoryByDay.map((group) => (
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
              <EmptyState text={hariSearch.trim() ? 'Tiada hasil untuk carian ini.' : 'Belum ada food history.'} />
            </Card>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setAddingFood(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft"
          >
            <Plus size={18} />
            Tambah Makanan
          </button>

          <SearchInput value={kategoriSearch} onChange={setKategoriSearch} placeholder="Cari nama makanan..." />

          {libraryByCategory.length ? (
            <div className="space-y-3">
              {libraryByCategory.map((group) => (
                <Card key={group.category} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-cocoa">{group.category}</h3>
                    {group.untriedCount > 0 ? (
                      <Pill tone="berry">{group.untriedCount} belum cuba</Pill>
                    ) : (
                      <Pill tone="sage">Semua sudah cuba</Pill>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const tried = item.tried_status === 'Sudah Cuba';
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 transition ${
                            tried ? 'bg-cream/60 opacity-60' : 'bg-cream'
                          }`}
                        >
                          <p className="min-w-0 flex-1 break-words text-sm font-semibold text-cocoa">{item.food_name}</p>
                          <button
                            type="button"
                            onClick={() => upsertLibraryItem({ ...item, tried_status: tried ? 'Belum Cuba' : 'Sudah Cuba' })}
                          >
                            <Pill tone={tried ? 'sage' : 'berry'}>{tried ? 'Sudah Cuba' : 'Belum Cuba'}</Pill>
                          </button>
                          <IconButton label="Padam" onClick={() => removeLibraryItem(item.id)} tone="danger">
                            <Trash2 size={15} />
                          </IconButton>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                text={
                  kategoriSearch.trim()
                    ? 'Tiada makanan sepadan dengan carian ini.'
                    : 'Belum ada senarai makanan. Tambah makanan ikut kategori dulu.'
                }
              />
            </Card>
          )}
        </>
      )}

      {addingFood ? (
        <FormModal
          title="Tambah Makanan"
          fields={[
            { name: 'food_name', label: 'Nama Makanan' },
            { name: 'category', label: 'Kategori', type: 'select', options: foodCategories },
          ]}
          initialValues={{ category: foodCategories[0] }}
          onClose={() => setAddingFood(false)}
          onSubmit={async (values) => {
            if (!values.food_name.trim()) return;
            await upsertLibraryItem({
              id: '',
              food_name: values.food_name.trim(),
              category: values.category as FoodLibraryItem['category'],
              tried_status: 'Belum Cuba',
            });
            setAddingFood(false);
          }}
        />
      ) : null}
    </div>
  );
}
