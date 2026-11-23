import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent?: 'indigo' | 'emerald' | 'rose' | 'blue';
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps['accent']>, string> = {
  indigo:
    'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  emerald:
    'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'indigo',
}: StatCardProps) {
  return (
    <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 transition-colors duration-150 hover:border-slate-300 dark:hover:border-slate-700/90">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-[26px] font-semibold tracking-tight text-slate-900 dark:text-white font-mono-tabular truncate">
            {value}
          </p>
        </div>
        <div
          className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ${ACCENT_STYLES[accent]}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
        {subtitle}
      </p>
    </div>
  );
}
