import { Edit3, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
import { ageCategories, foodCategories } from '../constants';
import type { Recipe } from '../types';

export function RecipesView({
  rows,
  upsert,
  remove,
}: {
  rows: Recipe[];
  upsert: (row: Recipe) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [age, setAge] = useState('Semua Umur');
  const [category, setCategory] = useState('Semua Kategori');
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => age === 'Semua Umur' || row.age_category === age)
      .filter((row) => category === 'Semua Kategori' || row.category === category)
      .filter((row) => [row.title, row.category, row.age_category, row.ingredients].join(' ').toLowerCase().includes(query));
  }, [age, category, rows, search]);

  const activeRecord =
    editing ??
    (adding
      ? ({
          age_category: ageCategories[0],
          category: foodCategories[0],
          image_url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80',
        } as Partial<Recipe>)
      : null);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Perpustakaan"
        title="Resepi bayi"
        action={
          <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft">
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Cari resepi, bahan, kategori..." />
      <div className="grid grid-cols-2 gap-2">
        <select value={age} onChange={(event) => setAge(event.target.value)} className="h-11 rounded-[18px] border border-white bg-white px-3 text-xs font-semibold shadow-sm outline-none">
          {['Semua Umur', ...ageCategories].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-[18px] border border-white bg-white px-3 text-xs font-semibold shadow-sm outline-none">
          {['Semua Kategori', ...foodCategories].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((row) => (
          <Card key={row.id} className="overflow-hidden p-0">
            <img src={row.image_url} alt={row.title} className="h-44 w-full object-cover" loading="lazy" />
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Pill tone="sage">{row.age_category}</Pill>
                    <Pill tone="peach">{row.category}</Pill>
                  </div>
                  <h3 className="text-lg font-bold">{row.title}</h3>
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
              <p className="text-sm">
                <span className="font-semibold text-cocoa/70">Bahan: </span>
                {row.ingredients}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-cocoa/70">Cara: </span>
                {row.instructions}
              </p>
              {row.source_link ? (
                <a href={row.source_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-sageDeep">
                  Sumber <ExternalLink size={15} />
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {!filtered.length ? <EmptyState text="Tiada resepi padan carian." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Resepi' : 'Tambah Resepi'}
          fields={[
            { name: 'title', label: 'Nama Resepi' },
            { name: 'image_url', label: 'Gambar', type: 'image' },
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'category', label: 'Kategori Makanan', type: 'select', options: foodCategories },
            { name: 'ingredients', label: 'Bahan', type: 'textarea' },
            { name: 'instructions', label: 'Cara Penyediaan', type: 'textarea' },
            { name: 'notes', label: 'Nota', type: 'textarea' },
            { name: 'source_link', label: 'Pautan Sumber', type: 'url' },
          ]}
          initialValues={activeRecord as Record<string, string>}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSubmit={(values) => {
            upsert({ id: editing?.id ?? '', ...values } as Recipe);
            setEditing(null);
            setAdding(false);
          }}
        />
      ) : null}
    </div>
  );
}
