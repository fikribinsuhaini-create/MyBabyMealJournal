import { ChevronDown, ChevronUp, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SectionTitle } from '../components/Ui';
import { ageCategories, foodStatuses, reactions, weeks } from '../constants';
import type { AgeCategory, FoodTracker, MenuPlanner } from '../types';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';

const META_START = '[[baby-food-meta:';
const META_END = ']]';

type TrackerFormValues = Record<string, string> & {
  age_category?: string;
  week?: string;
};

function statusTone(status: string) {
  if (status === 'Alergi') return 'berry';
  if (status === 'Perlu Dipantau') return 'butter';
  return 'sage';
}

function getDayNumber(day: string) {
  const match = String(day || '').match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
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
    image_url: '',
  };
}

export function TrackerView({
  rows,
  menuRows,
  upsert,
  remove,
}: {
  rows: FoodTracker[];
  menuRows: MenuPlanner[];
  upsert: (row: FoodTracker) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<FoodTracker | null>(null);
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<(Partial<FoodTracker> & TrackerFormValues) | null>(null);
  const [activeAge, setActiveAge] = useState(ageCategories[0]);
  const [activeWeek, setActiveWeek] = useState(weeks[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openDay, setOpenDay] = useState('');

  const groupedMenus = useMemo(
    () =>
      menuRows
        .filter((row) => row.menu)
        .sort((left, right) => {
          const ageCompare = ageCategories.indexOf(left.age_category) - ageCategories.indexOf(right.age_category);
          if (ageCompare !== 0) return ageCompare;
          const weekCompare = weeks.indexOf(left.week) - weeks.indexOf(right.week);
          if (weekCompare !== 0) return weekCompare;
          return getDayNumber(left.day) - getDayNumber(right.day);
        }),
    [menuRows]
  );

  const availableAges = useMemo(
    () => ageCategories.filter((ageCategory) => groupedMenus.some((row) => row.age_category === ageCategory)),
    [groupedMenus]
  );

  useEffect(() => {
    if (!availableAges.length) return;
    if (!availableAges.includes(activeAge as AgeCategory)) {
      setActiveAge(availableAges[0]);
    }
  }, [activeAge, availableAges]);

  const availableWeeks = useMemo(
    () => weeks.filter((week) => groupedMenus.some((row) => row.age_category === activeAge && row.week === week)),
    [activeAge, groupedMenus]
  );

  useEffect(() => {
    if (!availableWeeks.length) return;
    if (!availableWeeks.includes(activeWeek)) {
      setActiveWeek(availableWeeks[0]);
    }
  }, [activeWeek, availableWeeks]);

  const dayGroups = useMemo(() => {
    const filtered = groupedMenus.filter((row) => row.age_category === activeAge && row.week === activeWeek);

    return filtered
      .reduce<Array<{ day: string; date: string; items: MenuPlanner[] }>>((accumulator, row) => {
        const existing = accumulator.find((entry) => entry.day === row.day);
        if (existing) {
          existing.items.push(row);
          if (!existing.date && row.date) {
            existing.date = row.date;
          }
          return accumulator;
        }

        accumulator.push({ day: row.day, date: row.date, items: [row] });
        return accumulator;
      }, [])
      .sort((left, right) => getDayNumber(left.day) - getDayNumber(right.day));
  }, [activeAge, activeWeek, groupedMenus]);

  useEffect(() => {
    setOpenDay(dayGroups[0]?.day ?? '');
  }, [activeAge, activeWeek, dayGroups]);

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
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sageDeep">Flow baru</p>
            <h3 className="mt-1 text-lg font-bold text-cocoa">Satu tempat untuk catat makan</h3>
            <p className="mt-1 text-sm leading-relaxed text-cocoa/65">Tarikh, umur, minggu, makanan, reaksi, nota dan gambar masuk sini.</p>
          </div>
          <Pill tone="sage">Aman</Pill>
        </div>
      </Card>

      {groupedMenus.length ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sageDeep">Log lama</p>
              <p className="text-sm text-cocoa/65">Data MenuPlanner lama masih boleh dijadikan feedback.</p>
            </div>
            <Pill tone="sage">{groupedMenus.length} menu</Pill>
          </div>
          <button type="button" onClick={() => setPickerOpen(true)} className="h-12 w-full rounded-[18px] bg-white font-bold text-cocoa shadow-sm">
            Pilih log lama
          </button>
        </Card>
      ) : null}

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
                {row.image_url ? <Pill tone="sage">Ada gambar</Pill> : null}
              </div>

              {row.image_url ? (
                <div className="mt-4 overflow-hidden rounded-[20px] bg-cream">
                  <img src={row.image_url} alt={row.food_name} className="h-52 w-full object-cover" />
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
            { name: 'image_url', label: 'Gambar', type: 'image' },
          ]}
          initialValues={{ ...(activeRecord as Record<string, string>), introduced_date: toDateInputValue(activeRecord.introduced_date || '') }}
          onClose={() => {
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
          onSubmit={async (values) => {
            const ageCategory = values.age_category || ageCategories[0];
            const week = values.week || weeks[0];
            const saved = await upsert({
              id: editing?.id ?? '',
              food_name: values.food_name,
              introduced_date: values.introduced_date,
              status: values.status,
              reaction: values.reaction,
              notes: serializeTrackerNotes(values.notes || '', ageCategory, week),
              image_url: values.image_url || '',
            } as FoodTracker);
            if (!saved) return;
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
        />
      ) : null}

      {pickerOpen ? (
        <div className="fixed inset-0 z-40 bg-cocoa/35 px-4 py-5 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-md flex-col justify-end">
            <div className="flex max-h-[82vh] min-h-0 flex-col overflow-hidden rounded-[32px] bg-cream shadow-soft">
              <div className="flex items-center justify-between border-b border-white px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sageDeep">Log lama</p>
                  <h3 className="text-lg font-bold text-cocoa">Pilih MenuPlanner</h3>
                </div>
                <button type="button" onClick={() => setPickerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa" aria-label="Tutup picker">
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {availableAges.map((ageCategory) => (
                    <button
                      key={ageCategory}
                      type="button"
                      onClick={() => setActiveAge(ageCategory)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeAge === ageCategory ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
                      }`}
                    >
                      {ageCategory}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {availableWeeks.map((week) => (
                    <button
                      key={week}
                      type="button"
                      onClick={() => setActiveWeek(week)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeWeek === week ? 'bg-sage text-white shadow-soft' : 'bg-white text-cocoa/70'
                      }`}
                    >
                      {week}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {dayGroups.map((group) => {
                    const isOpen = openDay === group.day;
                    const dayName = weekdayFromDate(group.date);
                    return (
                      <div key={`${group.day}-${group.date}`} className="overflow-hidden rounded-[22px] bg-white shadow-sm">
                        <button type="button" onClick={() => setOpenDay(isOpen ? '' : group.day)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-black text-cocoa">{group.day}</p>
                            <p className="mt-1 text-xs font-semibold text-cocoa/55">
                              {group.date ? `${formatDisplayDate(group.date)}${dayName ? ` - ${dayName}` : ''}` : 'Tarikh belum set'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pill tone="sage">{group.items.length} menu</Pill>
                            {isOpen ? <ChevronUp size={18} className="text-cocoa/60" /> : <ChevronDown size={18} className="text-cocoa/60" />}
                          </div>
                        </button>

                        {isOpen ? (
                          <div className="space-y-2 border-t border-oat/60 px-4 py-4">
                            {group.items.map((source) => (
                              <button
                                key={source.id}
                                type="button"
                                onClick={() => {
                                  setPrefill({
                                    age_category: source.age_category,
                                    week: source.week,
                                    food_name: source.menu,
                                    introduced_date: source.date || todayIso(),
                                    status: 'Selamat',
                                    reaction: 'Belum Dinilai',
                                    notes: '',
                                    image_url: '',
                                  });
                                  setPickerOpen(false);
                                  setAdding(true);
                                }}
                                className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-cream px-4 py-3 text-left transition hover:bg-peach/10"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-sm font-bold text-cocoa">{source.menu}</p>
                                  <p className="mt-1 text-[11px] font-semibold text-cocoa/45">Jadikan log feedback</p>
                                </div>
                                <span className="rounded-full bg-sage/18 px-3 py-1 text-[11px] font-bold text-sageDeep">Pilih</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
