import type { ReactNode } from 'react';

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sageDeep">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const hasCustomBackground = /\bbg-/.test(className);
  return <article className={`rounded-[24px] p-4 shadow-soft ${hasCustomBackground ? '' : 'bg-white'} ${className}`}>{children}</article>;
}

export function Pill({ children, tone = 'peach' }: { children: ReactNode; tone?: 'peach' | 'sage' | 'butter' | 'berry' }) {
  const styles = {
    peach: 'bg-peach/28 text-peachDeep',
    sage: 'bg-sage/25 text-sageDeep',
    butter: 'bg-butter/45 text-cocoa',
    berry: 'bg-berry/15 text-berry',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[24px] border border-dashed border-oat bg-white/60 p-6 text-center text-sm font-medium text-cocoa/60">{text}</div>;
}

export function WeekTabs({ weeks, active, setActive }: { weeks: string[]; active: string; setActive: (week: string) => void }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {weeks.map((week) => (
        <button
          key={week}
          type="button"
          onClick={() => setActive(week)}
          className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
            active === week ? 'bg-cocoa text-white shadow-soft' : 'bg-white text-cocoa/70'
          }`}
        >
          {week}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mb-4 h-12 w-full rounded-[20px] border border-white bg-white px-4 text-sm shadow-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
    />
  );
}

export function IconButton({
  label,
  children,
  onClick,
  tone = 'white',
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  tone?: 'white' | 'peach' | 'danger';
}) {
  const styles = {
    white: 'bg-white text-cocoa',
    peach: 'bg-peach text-white',
    danger: 'bg-berry/15 text-berry',
  };
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`grid h-10 w-10 place-items-center rounded-full ${styles[tone]}`}>
      {children}
    </button>
  );
}
