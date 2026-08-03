import { Download, Loader2, Share2, UtensilsCrossed, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { trackerMealTimes } from '../constants';
import type { BabyProfile, FoodTracker } from '../types';
import { addDaysIso, formatDisplayDate, getMonthsBetweenDates, todayIso } from '../utils/date';
import { parseTrackerNotes } from '../utils/trackerMeta';

const PAGE_W = 794;
const PAGE_H = 1123;
const CAPTION_FONT = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";
const TAPE_COLORS = ['#A9C8A5', '#F7BFA8', '#FFE7A8', '#C7788D'];
const ROTATIONS = [-3, 2.4, -2, 3.4];

function ageLabel(birthDate: string, dateValue: string) {
  if (!birthDate) return '';
  const months = getMonthsBetweenDates(birthDate, dateValue);
  return months >= 12 ? '12 bulan ke atas' : `${months} bulan`;
}

function reactionEmoji(reaction: string) {
  if (!reaction || reaction === 'Belum Dinilai') return '';
  return reaction.split(' ')[0];
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function preloadImage(url: string) {
  return new Promise<boolean>((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    if (url.startsWith('data:')) {
      resolve(true);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function waitForImages(container: HTMLElement | null) {
  if (!container) return Promise.resolve();
  const images = Array.from(container.querySelectorAll('img'));
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 4000);
        })
    )
  );
}

function waitForPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

type ReportEntry = {
  row: FoodTracker;
  mealTime: string;
  cleanNotes: string;
};

type DensityTier = {
  nameClass: string;
  noteClass: string;
  labelClass: string;
  noteChars: number;
  gapPx: number;
  pad: string;
};

function densityFor(count: number): DensityTier {
  if (count <= 2) return { nameClass: 'text-2xl', noteClass: 'text-base', labelClass: 'text-xs', noteChars: 130, gapPx: 32, pad: 'p-4' };
  if (count <= 4) return { nameClass: 'text-xl', noteClass: 'text-sm', labelClass: 'text-xs', noteChars: 90, gapPx: 24, pad: 'p-3' };
  if (count <= 8) return { nameClass: 'text-base', noteClass: 'text-xs', labelClass: 'text-[10px]', noteChars: 55, gapPx: 16, pad: 'p-2.5' };
  return { nameClass: 'text-sm', noteClass: 'text-[11px]', labelClass: 'text-[10px]', noteChars: 34, gapPx: 12, pad: 'p-2' };
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

const PAGE_PADDING_Y = 80; // px-12 py-10 top+bottom
const HEADER_H = 132;

function layoutForEntries(dayEntries: ReportEntry[]) {
  const density = densityFor(dayEntries.length);
  const columns = dayEntries.length > 1 ? 2 : 1;
  const entryRows = chunk(dayEntries, columns);
  const contentAreaHeight = PAGE_H - PAGE_PADDING_Y - HEADER_H;
  const rowHeightPx = entryRows.length
    ? Math.max(60, Math.floor((contentAreaHeight - (entryRows.length - 1) * density.gapPx) / entryRows.length))
    : contentAreaHeight;
  return { density, columns, entryRows, rowHeightPx };
}

export function ReportExport({ rows, babyProfile }: { rows: FoodTracker[]; babyProfile?: BabyProfile }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [generatingMode, setGeneratingMode] = useState<'share' | 'download' | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [photoOk, setPhotoOk] = useState<Record<string, boolean>>({});

  const reportRootRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const babyName = babyProfile?.baby_name || 'Baby';
  const birthDate = babyProfile?.birth_date || '';

  const entries = useMemo<ReportEntry[]>(() => {
    return rows
      .filter((row) => row.introduced_date && row.introduced_date >= from && row.introduced_date <= to)
      .map((row) => {
        const meta = parseTrackerNotes(row.notes);
        return { row, mealTime: meta.meal_time, cleanNotes: meta.cleanNotes };
      })
      .sort((left, right) => {
        const dateDiff = new Date(left.row.introduced_date).getTime() - new Date(right.row.introduced_date).getTime();
        if (dateDiff !== 0) return dateDiff;
        const leftIndex = trackerMealTimes.indexOf(left.mealTime);
        const rightIndex = trackerMealTimes.indexOf(right.mealTime);
        return (leftIndex === -1 ? trackerMealTimes.length : leftIndex) - (rightIndex === -1 ? trackerMealTimes.length : rightIndex);
      });
  }, [rows, from, to]);

  const rangeLabel = from === to ? formatDisplayDate(from) : `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`;
  const photoCount = useMemo(() => entries.reduce((total, entry) => total + (entry.row.image_urls?.length ?? 0), 0), [entries]);

  const dateGroups = useMemo(() => {
    const map = new Map<string, ReportEntry[]>();
    entries.forEach((entry) => {
      const list = map.get(entry.row.introduced_date) ?? [];
      list.push(entry);
      map.set(entry.row.introduced_date, list);
    });
    return Array.from(map.entries()).map(([date, dayEntries]) => ({ date, dayEntries }));
  }, [entries]);

  const applyPreset = (preset: 'today' | 'yesterday' | 'week') => {
    const today = todayIso();
    if (preset === 'today') {
      setFrom(today);
      setTo(today);
    } else if (preset === 'yesterday') {
      const yesterday = addDaysIso(today, -1);
      setFrom(yesterday);
      setTo(yesterday);
    } else {
      setFrom(addDaysIso(today, -6));
      setTo(today);
    }
  };

  const generate = async (mode: 'share' | 'download') => {
    if (!entries.length) {
      setError('Tiada log makan dalam tarikh yang dipilih.');
      return;
    }

    setError('');
    setGeneratingMode(mode);
    try {
      const nextPhotoOk: Record<string, boolean> = {};
      await Promise.all(
        entries.map(async (entry) => {
          const url = entry.row.image_urls?.[0] ?? '';
          nextPhotoOk[entry.row.id] = url ? await preloadImage(url) : false;
        })
      );
      setPhotoOk(nextPhotoOk);
      setRendering(true);
      await waitForPaint();
      await waitForImages(reportRootRef.current);

      const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const html2canvas = html2canvasModule.default;

      const pages = pageRefs.current.filter((el): el is HTMLDivElement => Boolean(el));
      if (!pages.length) throw new Error('Report pages not ready');

      let pdf: InstanceType<typeof jsPDF> | null = null;
      for (const pageEl of pages) {
        const canvas = await html2canvas(pageEl, { scale: 2, backgroundColor: '#F3E4C9', useCORS: true });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (!pdf) {
          pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
        } else {
          pdf.addPage([canvas.width, canvas.height]);
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      }

      if (!pdf) throw new Error('PDF not generated');
      const fileSuffix = from === to ? from : `${from}_${to}`;
      const filename = `diari-makan-${babyName.toLowerCase().replace(/\s+/g, '-')}-${fileSuffix}.pdf`;

      let shared = false;
      if (mode === 'share') {
        const pdfFile = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
        if (navigator.canShare?.({ files: [pdfFile] })) {
          try {
            await navigator.share({ files: [pdfFile], title: `Diari Makan ${babyName}`, text: `Diari makan ${babyName} - ${rangeLabel}` });
            shared = true;
          } catch (shareError) {
            if (shareError instanceof Error && shareError.name === 'AbortError') shared = true;
          }
        }
      }
      if (!shared) pdf.save(filename);

      setOpen(false);
    } catch {
      setError('Gagal buat PDF. Cuba lagi sekejap.');
    } finally {
      setGeneratingMode(null);
      setRendering(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cocoa text-sm font-bold text-white shadow-soft"
      >
        <Share2 size={18} />
        Laporan PDF
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50 bg-cocoa/35 px-4 py-5 backdrop-blur-sm">
              <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[28px] bg-cream shadow-soft">
                <div className="flex items-center justify-between border-b border-white px-5 py-4">
                  <h2 className="text-lg font-bold text-cocoa">Laporan PDF</h2>
                  <button
                    type="button"
                    onClick={() => !generatingMode && setOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa disabled:opacity-50"
                    aria-label="Tutup"
                    disabled={generatingMode !== null}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-cocoa/80">Pilihan pantas</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => applyPreset('today')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa shadow-sm">
                        Harini
                      </button>
                      <button type="button" onClick={() => applyPreset('yesterday')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa shadow-sm">
                        Semalam
                      </button>
                      <button type="button" onClick={() => applyPreset('week')} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa shadow-sm">
                        7 Hari Lepas
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-cocoa/80">Dari Tarikh</span>
                      <input
                        type="date"
                        value={from}
                        max={to}
                        onChange={(event) => setFrom(event.target.value)}
                        className="h-12 w-full rounded-[20px] border border-oat bg-white px-3 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-cocoa/80">Hingga Tarikh</span>
                      <input
                        type="date"
                        value={to}
                        min={from}
                        onChange={(event) => setTo(event.target.value)}
                        className="h-12 w-full rounded-[20px] border border-oat bg-white px-3 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                      />
                    </label>
                  </div>

                  <div className="rounded-[20px] bg-white/70 px-4 py-3">
                    <p className="text-sm font-semibold text-cocoa/70">
                      {entries.length} log makan · {photoCount} gambar dijumpai dari {rangeLabel}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-cocoa/45">
                      {dateGroups.length > 1
                        ? `Setiap tarikh jadi 1 muka surat A4 (${dateGroups.length} muka surat).`
                        : 'Akan dimuatkan dalam 1 muka surat A4.'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-cocoa/45">Kalau telefon tak sokong share terus, PDF akan didownload.</p>
                  </div>

                  {error ? <p className="text-sm font-semibold text-berry">{error}</p> : null}
                </div>

                <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-cream px-5 pb-5 pt-3">
                  <button
                    type="button"
                    onClick={() => generate('download')}
                    disabled={generatingMode !== null}
                    className="flex h-12 items-center justify-center gap-2 rounded-[18px] bg-white font-semibold text-cocoa shadow-sm disabled:opacity-60"
                  >
                    {generatingMode === 'download' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {generatingMode === 'download' ? 'Menjana...' : 'Muat Turun'}
                  </button>
                  <button
                    type="button"
                    onClick={() => generate('share')}
                    disabled={generatingMode !== null}
                    className="flex h-12 items-center justify-center gap-2 rounded-[18px] bg-sage font-semibold text-white shadow-soft disabled:opacity-60"
                  >
                    {generatingMode === 'share' ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    {generatingMode === 'share' ? 'Menjana...' : 'Kongsi PDF'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {rendering
        ? createPortal(
            <div ref={reportRootRef} style={{ position: 'fixed', top: 0, left: -99999, width: PAGE_W, height: 0, overflow: 'visible' }}>
              {dateGroups.map((group, groupIndex) => {
                const { density, columns, entryRows, rowHeightPx } = layoutForEntries(group.dayEntries);
                const groupPhotoCount = group.dayEntries.reduce((total, entry) => total + (entry.row.image_urls?.length ?? 0), 0);

                return (
                  <div
                    key={group.date}
                    ref={(el) => {
                      pageRefs.current[groupIndex] = el;
                    }}
                    style={{
                      width: PAGE_W,
                      height: PAGE_H,
                      backgroundColor: '#F3E4C9',
                      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(111,86,72,.10) 1px, transparent 0)',
                      backgroundSize: '16px 16px',
                    }}
                    className="relative flex flex-col overflow-hidden px-12 py-10 font-poppins"
                  >
                    <div className="relative shrink-0 overflow-hidden" style={{ height: HEADER_H }}>
                      <div
                        className="mb-1 ml-1 w-max rounded-sm px-6 py-3 shadow-md"
                        style={{ backgroundColor: '#F7BFA8', transform: 'rotate(-1.4deg)', boxShadow: '0 6px 14px -6px rgba(111,86,72,.4)' }}
                      >
                        <h1 className="text-3xl font-black leading-none text-cocoa">Diari Makan {babyName} 🍼</h1>
                      </div>
                      <p className="ml-2 mt-4 text-sm font-semibold text-cocoa/60">
                        {formatDisplayDate(group.date)}
                        {birthDate ? ` · ${ageLabel(birthDate, group.date)}` : ''} · {group.dayEntries.length} log · {groupPhotoCount} gambar
                      </p>
                      {dateGroups.length > 1 ? (
                        <span className="absolute right-0 top-0 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-cocoa/70">
                          Hari {groupIndex + 1}/{dateGroups.length}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col" style={{ gap: density.gapPx }}>
                      {entryRows.map((rowEntries, rowIndex) => (
                        <div key={rowIndex} className={`flex ${columns === 1 ? 'justify-center' : ''}`} style={{ height: rowHeightPx, gap: density.gapPx }}>
                          {rowEntries.map((entry, colIndex) => {
                            const index = rowIndex * columns + colIndex;
                            const hasPhoto = Boolean(photoOk[entry.row.id] && entry.row.image_urls?.[0]);
                            const sticker = reactionEmoji(entry.row.reaction);

                            return (
                              <div
                                key={entry.row.id}
                                className={`relative flex flex-col overflow-hidden bg-white ${columns === 1 ? 'w-[60%]' : 'flex-1'} ${density.pad}`}
                                style={{ height: rowHeightPx, transform: `rotate(${ROTATIONS[index % ROTATIONS.length]}deg)`, boxShadow: '0 10px 22px -10px rgba(74,54,38,.45)' }}
                              >
                                <div
                                  className="absolute left-1/2 top-0 h-6 w-20 opacity-70"
                                  style={{ backgroundColor: TAPE_COLORS[index % TAPE_COLORS.length], transform: 'translate(-50%, -40%) rotate(-5deg)' }}
                                />

                                <div className="relative min-h-0 flex-1 overflow-hidden bg-oat">
                                  {hasPhoto ? (
                                    <img src={entry.row.image_urls[0]} alt={entry.row.food_name} className="h-full w-full object-cover" crossOrigin="anonymous" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-peach/20 to-sage/20">
                                      <UtensilsCrossed size={40} className="text-peachDeep/40" />
                                    </div>
                                  )}
                                  {sticker ? (
                                    <span className="absolute bottom-1 right-1 text-2xl" style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.25))' }}>
                                      {sticker}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="shrink-0 pt-3">
                                  <p className={`font-poppins font-bold uppercase tracking-[0.06em] text-peachDeep ${density.labelClass}`}>{entry.mealTime || 'Waktu belum set'}</p>
                                  <p className={`mt-0.5 break-words leading-tight text-cocoa ${density.nameClass}`} style={{ fontFamily: CAPTION_FONT }}>
                                    {entry.row.food_name}
                                  </p>
                                  {entry.cleanNotes ? (
                                    <p className={`mt-0.5 leading-snug text-cocoa/70 ${density.noteClass}`} style={{ fontFamily: CAPTION_FONT }}>
                                      {truncate(entry.cleanNotes, density.noteChars)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                          {rowEntries.length < columns ? <div className="flex-1" /> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
