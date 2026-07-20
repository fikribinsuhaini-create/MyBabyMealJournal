import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Recipe } from '../types';
import { Card, EmptyState, Pill, SearchInput } from './Ui';

export function MenuPicker({ rows, onPick, onClose }: { rows: Recipe[]; onPick: (row: Recipe) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows.filter((row) => [row.title, row.age_category, row.author, row.ingredients].join(' ').toLowerCase().includes(query));
  }, [rows, search]);

  return (
    <div className="fixed inset-0 z-50 bg-cocoa/35 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[28px] bg-cream shadow-soft">
        <div className="flex items-center justify-between border-b border-white px-5 py-4">
          <h2 className="text-lg font-bold">Pilih dari Menu</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama menu, bahan..." />

          {filtered.map((row) => (
            <Card key={row.id} className="space-y-2">
              <div className="mb-1 flex flex-wrap gap-2">
                <Pill tone="sage">{row.age_category}</Pill>
                <Pill tone={row.author === 'Ayah' ? 'sage' : 'peach'}>{row.author}</Pill>
              </div>
              <h3 className="text-base font-bold">{row.title}</h3>
              <p className="text-sm text-cocoa/70">{row.ingredients}</p>
              <button
                type="button"
                onClick={() => onPick(row)}
                className="mt-1 h-10 w-full rounded-full bg-sage text-sm font-bold text-white shadow-soft"
              >
                Guna Menu Ini
              </button>
            </Card>
          ))}

          {!filtered.length ? <EmptyState text="Tiada menu sepadan. Taip terus di borang bawah." /> : null}
        </div>
      </div>
    </div>
  );
}
