import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CurrencyCode, MonthlySummaryPoint } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface MonthlySpendingChartProps {
  data: MonthlySummaryPoint[];
  currency: CurrencyCode;
  isDark: boolean;
}

export function MonthlySpendingChart({
  data,
  currency,
  isDark,
}: MonthlySpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No monthly transaction data available yet.
      </div>
    );
  }

  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';
  const tickColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 12 }}
            tickFormatter={(val: number) => formatCurrency(val, currency, { compact: true })}
            width={62}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1426] p-3 shadow-xl text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white mb-2">
                    {label}
                  </p>
                  {payload.map((entry) => (
                    <div
                      key={String(entry.dataKey)}
                      className="flex items-center justify-between gap-4 py-0.5"
                    >
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                        {formatCurrency(Number(entry.value ?? 0), currency)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#3B82F6"
            strokeWidth={2.2}
            fillOpacity={1}
            fill="url(#incomeGrad)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#8B5CF6"
            strokeWidth={2.2}
            fillOpacity={1}
            fill="url(#expenseGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
