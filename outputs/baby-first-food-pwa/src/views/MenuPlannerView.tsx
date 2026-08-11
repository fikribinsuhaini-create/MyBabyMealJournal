import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SearchInput, SectionTitle } from '../components/Ui';
import { ageCategories, menuAuthors } from '../constants';
import type { MenuIdea, Recipe } from '../types';

function authorTone(author: string) {
  return author === 'Ayah' ? 'sage' : 'peach';
}

export function MenuPlannerView({
  rows,
  upsert,
  remove,
  ideaRows,
  upsertIdea,
  removeIdea,
}: {
  rows: Recipe[];
  upsert: (row: Recipe) => Promise<void>;
  remove: (id: string) => Promise<void>;
  ideaRows: MenuIdea[];
  upsertIdea: (row: MenuIdea) => Promise<void>;
  removeIdea: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'resepi' | 'idea'>('resepi');
  const [search, setSearch] = useState('');
  const [age, setAge] = useState('Semua Umur');
  const [author, setAuthor] = useState('Semua');
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [adding, setAdding] = useState(false);
  const [ideaSearch, setIdeaSearch] = useState('');
  const [ideaAge, setIdeaAge] = useState('Semua Umur');
  const [addingIdea, setAddingIdea] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return rows
      .filter((row) => age === 'Semua Umur' || row.age_category === age)
      .filter((row) => author === 'Semua' || row.author === author)
      .filter((row) => [row.title, row.age_category, row.author, row.ingredients].join(' ').toLowerCase().includes(query));
  }, [age, author, rows, search]);

  const filteredIdeas = useMemo(() => {
    const query = ideaSearch.trim().toLowerCase();
    return ideaRows
      .filter((row) => ideaAge === 'Semua Umur' || row.age_category === ideaAge)
      .filter((row) => !query || row.title.toLowerCase().includes(query));
  }, [ideaAge, ideaRows, ideaSearch]);

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
          <button
            type="button"
            onClick={() => (mode === 'resepi' ? setAdding(true) : setAddingIdea(true))}
            className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft"
          >
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <div className="flex gap-2">
        {(
          [
            { key: 'resepi', label: 'Resepi Penuh' },
            { key: 'idea', label: 'Idea Menu' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`h-11 flex-1 rounded-full text-sm font-semibold transition ${
              mode === tab.key ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'resepi' ? (
        <>
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
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-cocoa/60">Senarai ringkas nama menu untuk 1 pinggan &mdash; tak perlu bahan atau cara penyediaan.</p>

          <SearchInput value={ideaSearch} onChange={setIdeaSearch} placeholder="Cari nama menu..." />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Semua Umur', ...ageCategories].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setIdeaAge(option)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  ideaAge === option ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredIdeas.map((row) => (
              <Card key={row.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-base font-bold text-cocoa">{row.title}</p>
                  <Pill tone="sage">{row.age_category}</Pill>
                </div>
                <IconButton label="Padam" onClick={() => removeIdea(row.id)} tone="danger">
                  <Trash2 size={17} />
                </IconButton>
              </Card>
            ))}
          </div>

          {!filteredIdeas.length ? <EmptyState text="Tiada idea menu lagi. Tambah nama menu ringkas dulu." /> : null}
        </>
      )}

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

      {addingIdea ? (
        <FormModal
          title="Tambah Idea Menu"
          fields={[
            { name: 'title', label: 'Nama Menu' },
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
          ]}
          initialValues={{ age_category: ageCategories[0] }}
          onClose={() => setAddingIdea(false)}
          onSubmit={async (values) => {
            if (!values.title.trim()) return;
            await upsertIdea({
              id: '',
              title: values.title.trim(),
              age_category: values.age_category as MenuIdea['age_category'],
            });
            setAddingIdea(false);
          }}
        />
      ) : null}
    </div>
  );
}
