import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SectionTitle } from '../components/Ui';
import { ageCategories, foodStatuses, reactions, weeks } from '../constants';
import type { FoodTracker } from '../types';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';

const META_START = '[[baby-food-meta:';
const META_END = ']]';

type TrackerFormValues = {
  age_category?: string;
  week?: string;
};

function statusTone(status: string) {
  if (status === 'Alergi') return 'berry';
  if (status === 'Perlu Dipantau') return 'butter';
  return 'sage';
}

function weekdayFromDate(dateValue: string) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('ms-MY', { weekday: 'long' }).format(parsed);
}

function parseTrackerNotes(notes = '') {
  if (!notes.startsWith(META_START)) {
    return { age_category: '', week: '', cleanNotes: notes };
  }

  const closeIndex = notes.indexOf(META_END);
  if (closeIndex === -1) {
    return { age_category: '', week: '', cleanNotes: notes };
  }

  const rawMeta = notes.slice(META_START.length, closeIndex);
  const cleanNotes = notes.slice(closeIndex + META_END.length).replace(/^\n+/, '');

  try {
    const meta = JSON.parse(rawMeta) as Partial<Record<'age_category' | 'week', string>>;
    return {
      age_category: meta.age_category ?? '',
      week: meta.week ?? '',
      cleanNotes,
    };
  } catch {
    return { age_category: '', week: '', cleanNotes };
  }
}

function serializeTrackerNotes(notes: string, ageCategory: string, week: string) {
  const meta = JSON.stringify({ age_category: ageCategory, week });
  const cleanNotes = notes.trim();
  return cleanNotes ? `${META_START}${meta}${META_END}\n${cleanNotes}` : `${META_START}${meta}${META_END}`;
}

function trackerAge(row: FoodTracker) {
  return parseTrackerNotes(row.notes).age_category || 'Umur belum set';
}

function trackerWeek(row: FoodTracker) {
  return parseTrackerNotes(row.notes).week || 'Minggu belum set';
}

function cleanTrackerNotes(row: FoodTracker) {
  return parseTrackerNotes(row.notes).cleanNotes;
}

function createDefaultRecord(activeAge: string, activeWeek: string): Partial<FoodTracker> & TrackerFormValues {
  return {
    age_category: activeAge,
    week: activeWeek,
    introduced_date: todayIso(),
    status: foodStatuses[0],
    reaction: reactions[0],
    notes: '',
    image_urls: [],
  };
}

export function TrackerView({
  rows,
  upsert,
  remove,
}: {
  rows: FoodTracker[];
  upsert: (row: FoodTracker) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<FoodTracker | null>(null);
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<(Partial<FoodTracker> & TrackerFormValues) | null>(null);
  const [activeAge] = useState(ageCategories[0]);
  const [activeWeek] = useState(weeks[0]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        const leftDate = new Date(left.introduced_date).getTime();
        const rightDate = new Date(right.introduced_date).getTime();
        return rightDate - leftDate;
      }),
    [rows]
  );

  const activeRecord = editing
    ? ({
        ...editing,
        age_category: trackerAge(editing) === 'Umur belum set' ? ageCategories[0] : trackerAge(editing),
        week: trackerWeek(editing) === 'Minggu belum set' ? weeks[0] : trackerWeek(editing),
        notes: cleanTrackerNotes(editing),
      } as Partial<FoodTracker> & TrackerFormValues)
    : adding
      ? prefill ?? createDefaultRecord(activeAge, activeWeek)
      : null;

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Jurnal Makan"
        title="Log & feedback"
        action={
          <button
            type="button"
            onClick={() => {
              setPrefill(null);
              setAdding(true);
            }}
            className="flex h-11 items-center gap-2 rounded-full bg-peach px-4 text-sm font-bold text-white shadow-soft"
          >
            <Plus size={18} />
            Tambah
          </button>
        }
      />

      <Card className="space-y-3 bg-sage/12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sageDeep">Jurnal harian</p>
            <h3 className="mt-1 text-lg font-bold text-cocoa">Catat makan bayi</h3>
            <p className="mt-1 text-sm leading-relaxed text-cocoa/65">Tarikh, umur, minggu, makanan, reaksi, nota dan gambar dalam satu tempat.</p>
          </div>
          <Pill tone="sage">{rows.length} log</Pill>
        </div>
      </Card>

      <div className="space-y-3">
        {sortedRows.map((row) => {
          const displayNotes = cleanTrackerNotes(row);
          const displayAge = trackerAge(row);
          const displayWeek = trackerWeek(row);
          const dayName = weekdayFromDate(row.introduced_date);

          return (
            <Card key={row.id} className="overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                    <Pill tone="sage">{formatDisplayDate(row.introduced_date)}</Pill>
                    {dayName ? <Pill tone="peach">{dayName}</Pill> : null}
                  </div>
                  <h3 className="break-words text-xl font-bold leading-tight">{row.food_name}</h3>
                  <p className="mt-1 text-sm text-cocoa/55">{displayAge} - {displayWeek}</p>
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

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone={row.reaction.includes('Ada Reaksi') ? 'berry' : row.reaction === 'Belum Dinilai' ? 'butter' : 'peach'}>{row.reaction}</Pill>
                {displayNotes ? <Pill tone="sage">Ada catatan</Pill> : null}
                {row.image_urls?.length ? <Pill tone="sage">{row.image_urls.length} gambar</Pill> : null}
              </div>

              {row.image_urls?.length ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {row.image_urls.map((url, index) => (
                    <div key={`${row.id}-${index}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-[18px] bg-cream">
                      <img src={url} alt={row.food_name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}

              {displayNotes ? (
                <div className="mt-4 rounded-[18px] bg-cream px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa/50">Diari Harian</p>
                  <p className="mt-2 text-sm leading-relaxed text-cocoa/80">{displayNotes}</p>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {!sortedRows.length ? <EmptyState text="Belum ada log makan." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Log' : 'Tambah Log'}
          fields={[
            { name: 'age_category', label: 'Kategori Umur', type: 'select', options: ageCategories },
            { name: 'week', label: 'Minggu', type: 'select', options: weeks },
            { name: 'introduced_date', label: 'Tarikh', type: 'date' },
            { name: 'food_name', label: 'Makanan / Menu' },
            { name: 'status', label: 'Status', type: 'select', options: foodStatuses },
            { name: 'reaction', label: 'Reaksi', type: 'select', options: reactions },
            { name: 'notes', label: 'Nota / Diari', type: 'textarea' },
            { name: 'image_urls', label: 'Gambar', type: 'image', multiple: true },
          ]}
          initialValues={{
            ...(activeRecord as unknown as Record<string, string>),
            introduced_date: toDateInputValue(activeRecord.introduced_date || ''),
            image_urls: JSON.stringify(activeRecord.image_urls ?? []),
          }}
          onClose={() => {
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
          onSubmit={async (values) => {
            const ageCategory = values.age_category || ageCategories[0];
            const week = values.week || weeks[0];
            let imageUrls: string[] = [];
            try {
              const parsed = JSON.parse(values.image_urls || '[]');
              imageUrls = Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === 'string' && url.length > 0) : [];
            } catch {
              imageUrls = [];
            }
            const saved = await upsert({
              id: editing?.id ?? '',
              food_name: values.food_name,
              introduced_date: values.introduced_date,
              status: values.status,
              reaction: values.reaction,
              notes: serializeTrackerNotes(values.notes || '', ageCategory, week),
              image_urls: imageUrls,
            } as FoodTracker);
            if (!saved) return;
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
        />
      ) : null}
    </div>
  );
}