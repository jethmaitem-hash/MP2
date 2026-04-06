'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { YearlyRow, MonthlyRow, FlexibleContribution } from '@/types'
import { formatPHP } from '@/utils/formatters'

type ChartMode = 'balance' | 'monthly' | 'actual'

interface GrowthChartProps {
  yearlyRows: YearlyRow[]
  monthlyRows: MonthlyRow[]
  actualContributions: FlexibleContribution[]
  name: string
}

// ─── Data builders ───────────────────────────────────────────────────────────

function buildBalanceData(yearly: YearlyRow[], monthly: MonthlyRow[], view: 'yearly' | 'monthly') {
  if (view === 'yearly') {
    let cumInvested = 0
    return [
      { label: 'Start', maturity: 0, invested: 0 },
      ...yearly.map((r) => {
        cumInvested += r.contributions
        return { label: String(r.calendarYear), maturity: r.closingBalance, invested: cumInvested }
      }),
    ]
  }
  // Monthly — show running balance and cumulative invested
  let cumInvested = 0
  return monthly.map((r, i) => {
    cumInvested += r.contribution
    return {
      label: i % 5 === 0 ? r.label : '',
      fullLabel: r.label,
      maturity: r.closingBalance,
      invested: cumInvested,
    }
  })
}

function buildMonthlyBarData(monthly: MonthlyRow[]) {
  return monthly.map((r) => ({
    label: r.label,
    contribution: r.contribution,
    dividend: r.dividendAccrued,
  }))
}

function buildActualData(monthly: MonthlyRow[], actual: FlexibleContribution[]) {
  const actualMap = new Map(actual.map((a) => [a.date, a.amount]))
  return monthly.map((r) => {
    const yyyyMM = `${r.calendarYear}-${String(r.calendarMonth).padStart(2, '0')}`
    const actualAmt = actualMap.get(yyyyMM) ?? 0
    return {
      label: r.label,
      planned: r.contribution,
      actual: actualAmt,
      diff: actualAmt - r.contribution,
    }
  })
}

// ─── Tooltips ────────────────────────────────────────────────────────────────

const BalanceTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-xl border border-gray-100 rounded-xl p-3 text-xs">
      <p className="font-bold text-gray-700 mb-1.5">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-gray-500">{e.name}</span>
          </span>
          <span className="font-semibold">{formatPHP(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-xl border border-gray-100 rounded-xl p-3 text-xs">
      <p className="font-bold text-gray-700 mb-1.5">{label}</p>
      {payload.filter((e) => e.value !== 0).map((e) => (
        <div key={e.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-gray-500">{e.name}</span>
          </span>
          <span className={`font-semibold ${e.value < 0 ? 'text-red-500' : ''}`}>
            {e.value < 0 ? '-' : ''}{formatPHP(Math.abs(e.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

const yFmt = (v: number) =>
  v >= 1_000_000 ? `₱${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `₱${(v / 1000).toFixed(0)}K` : `₱${v}`

// ─── Main component ───────────────────────────────────────────────────────────

export function GrowthChart({ yearlyRows, monthlyRows, actualContributions, name }: GrowthChartProps) {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<ChartMode>('balance')
  const [balanceView, setBalanceView] = useState<'yearly' | 'monthly'>('yearly')

  useEffect(() => setMounted(true), [])

  const balanceData  = useMemo(() => buildBalanceData(yearlyRows, monthlyRows, balanceView), [yearlyRows, monthlyRows, balanceView])
  const monthlyData  = useMemo(() => buildMonthlyBarData(monthlyRows), [monthlyRows])
  const safeActual   = actualContributions ?? []
  const actualData   = useMemo(() => buildActualData(monthlyRows, safeActual), [monthlyRows, safeActual])
  const hasActual    = safeActual.length > 0

  const MODES: { key: ChartMode; label: string }[] = [
    { key: 'balance', label: 'Balance' },
    { key: 'monthly', label: 'Contributions' },
    { key: 'actual',  label: 'Target vs Actual' },
  ]

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Growth Chart</h3>
          <p className="text-xs text-gray-500 mt-0.5">{name}</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                mode === m.key ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
              } ${m.key === 'actual' && !hasActual ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={m.key === 'actual' && !hasActual}
              title={m.key === 'actual' && !hasActual ? 'Enable "Track actual contributions" in the form first' : undefined}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ── Balance mode ── */}
        {mode === 'balance' && (
          <>
            {/* Yearly / Monthly sub-toggle */}
            <div className="flex justify-end mb-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(['yearly', 'monthly'] as const).map((v) => (
                  <button key={v} onClick={() => setBalanceView(v)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                      balanceView === v ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="matGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1e3a8a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={yFmt} width={62} />
                <Tooltip content={<BalanceTooltip />} />
                <Area type="monotone" dataKey="maturity" name="Balance" stroke="#1e3a8a" strokeWidth={2.5} fill="url(#matGrad)" dot={false} activeDot={{ r: 5, fill: '#1e3a8a' }} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" fill="url(#invGrad)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3">
              <LegendItem color="#1e3a8a" label="Balance" />
              <LegendItem color="#f59e0b" label="Invested" dashed />
            </div>
          </>
        )}

        {/* ── Monthly contributions bar chart ── */}
        {mode === 'monthly' && (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  interval={4} angle={-30} textAnchor="end" height={36} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={yFmt} width={62} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="contribution" name="Contribution" fill="#1e3a8a" radius={[2, 2, 0, 0]} maxBarSize={18} />
                <Bar dataKey="dividend" name="Dividend Credited" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3">
              <LegendItem color="#1e3a8a" label="Contribution" />
              <LegendItem color="#10b981" label="Dividend Credited (year-end)" />
            </div>
          </>
        )}

        {/* ── Target vs Actual ── */}
        {mode === 'actual' && hasActual && (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={actualData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  interval={4} angle={-30} textAnchor="end" height={36} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={yFmt} width={62} />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="planned" name="Planned" fill="#1e3a8a" radius={[2, 2, 0, 0]} maxBarSize={14} fillOpacity={0.6} />
                <Bar dataKey="actual"  name="Actual"  fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-5 mt-3">
              <LegendItem color="#1e3a8a" label="Planned" />
              <LegendItem color="#f59e0b" label="Actual" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="10">
        <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth={2} strokeDasharray={dashed ? '4 2' : undefined} />
      </svg>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
