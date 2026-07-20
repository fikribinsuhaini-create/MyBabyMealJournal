import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
import { ageCategories, menuAuthors } from '../constants';
import type { Recipe } from '../types';

function authorTone(author: string) {
  return author === 'Ayah' ? 'sage' : 'peach';
}

export function MenuPlannerView({
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
  const [author, setAuthor] = useState('Semua');
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => age === 'Semua Umur' || row.age_category === age)
      .filter((row) => author === 'Semua' || row.author === author)
      .filter((row) => [row.title, row.age_category, row.author, row.ingredients].join(' ').toLowerCase().includes(query));
  }, [age, author, rows, search]);

  const activeRecord =
    editing ??
    (adding
      ? ({
          age_category: ageCategories[0],
          author: menuAuthors[0],
        } as Partial<Recipe>)
      : null);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Perancang Menu"
        title="Menu Ayah & Ibu"
        action={
          <button type="button" onClick={() => setAdding(true)} className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft">
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Cari nama menu, bahan..." />
      <div className="grid grid-cols-2 gap-2">
        <select value={age} onChange={(event) => setAge(event.target.value)} className="h-11 rounded-[18px] border border-white bg-white px-3 text-xs font-semibold shadow-sm outline-none">
          {['Semua Umur', ...ageCategories].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select value={author} onChange={(event) => setAuthor(event.target.value)} className="h-11 rounded-[18px] border border-white bg-white px-3 text-xs font-semibold shadow-sm outline-none">
          {['Semua', ...menuAuthors].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((row) => (
          <Card key={row.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Pill tone="sage">{row.age_category}</Pill>
                  <Pill tone={authorTone(row.author)}>{row.author}</Pill>
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
            <p className="text-sm">
              <span className="font-semibold text-cocoa/70">Cara Penyediaan: </span>
              {row.instructions}
            </p>
          </Card>
        ))}
      </div>

      {!filtered.length ? <EmptyState text="Tiada menu padan carian." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Menu' : 'Tambah Menu'}
          fields={[
            { name: 'title', label: 'Nama Menu' },
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'author', label: 'Dicipta Oleh', type: 'select', options: menuAuthors },
            { name: 'ingredients', label: 'Bahan', type: 'textarea' },
            { name: 'instructions', label: 'Cara Penyediaan', type: 'textarea' },
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
