import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormModal } from '../components/FormModal';
import { Card, EmptyState, IconButton, Pill, SectionTitle } from '../components/Ui';
import { foodStatuses, reactions } from '../constants';
import { formatDisplayDate, todayIso, toDateInputValue } from '../utils/date';
import type { FoodTracker, MenuPlanner } from '../types';

function statusTone(status: string) {
  if (status === 'Alergi') return 'berry';
  if (status === 'Perlu Dipantau') return 'butter';
  return 'sage';
}

export function TrackerView({
  rows,
  menuRows,
  upsert,
  remove,
}: {
  rows: FoodTracker[];
  menuRows: MenuPlanner[];
  upsert: (row: FoodTracker) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<FoodTracker | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [prefill, setPrefill] = useState<Partial<FoodTracker> | null>(null);

  const menuOptions = useMemo(
    () =>
      menuRows
        .filter((row) => row.menu)
        .map((row) => ({ id: row.id, label: `${row.week} - ${row.age_category} - ${row.day} - ${row.menu}` })),
    [menuRows]
  );
  const selectedMenu = menuRows.find((row) => row.id === selectedMenuId) ?? menuRows[0];
  const activeRecord =
    editing ??
    (adding
      ? prefill ??
        ({
          introduced_date: todayIso(),
          status: foodStatuses[0],
          reaction: reactions[0],
        } as Partial<FoodTracker>)
      : null);

  return (
    <div className="space-y-4">
      <SectionTitle
        eyebrow="Food Tracker"
        title="Feedback makanan"
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
            Manual
          </button>
        }
      />

      {menuOptions.length ? (
        <Card className="space-y-3">
          <p className="text-sm font-bold">Ambil dari menu</p>
          <div className="grid gap-2">
            <select
              value={selectedMenuId}
              onChange={(event) => setSelectedMenuId(event.target.value)}
              className="h-12 rounded-[18px] border border-oat bg-cream px-3 text-sm font-semibold outline-none"
            >
              {menuOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const source = selectedMenu;
                if (!source) return;
                setPrefill({
                  food_name: source.menu,
                  introduced_date: todayIso(),
                  status: 'Selamat',
                  reaction: 'Belum Dinilai',
                });
                setAdding(true);
              }}
              className="h-11 rounded-[18px] bg-sage font-bold text-white shadow-soft"
            >
              Tambah feedback
            </button>
          </div>
        </Card>
      ) : null}

      <div className="relative space-y-3 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-0.5 before:bg-sage/35">
        {rows.map((row) => (
          <Card key={row.id} className="relative ml-7">
            <span className="absolute -left-9 top-6 h-4 w-4 rounded-full border-4 border-cream bg-sage" />
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <Pill tone={statusTone(row.status)}>{row.status}</Pill>
                <h3 className="mt-2 text-lg font-bold">{row.food_name}</h3>
                <p className="text-xs font-semibold text-cocoa/55">{formatDisplayDate(row.introduced_date)}</p>
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
            <div className="flex flex-wrap gap-2">
              <Pill tone={row.reaction.includes('Ada Reaksi') ? 'berry' : row.reaction === 'Belum Dinilai' ? 'butter' : 'peach'}>{row.reaction}</Pill>
              {row.notes ? <Pill tone="sage">{row.notes}</Pill> : null}
            </div>
          </Card>
        ))}
      </div>

      {!rows.length ? <EmptyState text="Belum ada feedback makanan." /> : null}

      {activeRecord ? (
        <FormModal
          title={editing ? 'Kemaskini Feedback' : 'Tambah Feedback'}
          fields={[
            { name: 'food_name', label: 'Nama Makanan' },
            { name: 'introduced_date', label: 'Tarikh Diperkenalkan', type: 'date' },
            { name: 'status', label: 'Status', type: 'select', options: foodStatuses },
            { name: 'reaction', label: 'Reaksi', type: 'select', options: reactions },
            { name: 'notes', label: 'Nota', type: 'textarea' },
          ]}
          initialValues={{ ...(activeRecord as Record<string, string>), introduced_date: toDateInputValue(activeRecord.introduced_date || '') }}
          onClose={() => {
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
          onSubmit={(values) => {
            upsert({ id: editing?.id ?? '', ...values } as FoodTracker);
            setEditing(null);
            setAdding(false);
            setPrefill(null);
          }}
        />
      ) : null}
    </div>
  );
}
