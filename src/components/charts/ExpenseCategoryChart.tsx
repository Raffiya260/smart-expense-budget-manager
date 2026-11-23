import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryBreakdownPoint, CurrencyCode } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface ExpenseCategoryChartProps {
  data: CategoryBreakdownPoint[];
  currency: CurrencyCode;
}

export function ExpenseCategoryChart({ data, currency }: ExpenseCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No expenses recorded for this period.
      </div>
    );
  }

  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as CategoryBreakdownPoint;
                return (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1426] px-3 py-2 shadow-xl text-xs">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.category}
                    </p>
                    <p className="mt-1 font-mono-tabular text-slate-600 dark:text-slate-300">
                      {formatCurrency(item.amount, currency)} · {item.percentage}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total Spent
          </span>
          <span className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white font-mono-tabular">
            {formatCurrency(totalExpenses, currency, { compact: true })}
          </span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="truncate text-slate-700 dark:text-slate-300">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono-tabular">
              <span className="font-medium text-slate-900 dark:text-white">
                {formatCurrency(item.amount, currency)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 w-11 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
