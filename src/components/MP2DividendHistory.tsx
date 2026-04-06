'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

export const MP2_HISTORICAL_RATES: { year: number; rate: number }[] = [
  { year: 2023, rate: 0.0703 },
  { year: 2022, rate: 0.0703 },
  { year: 2021, rate: 0.0600 },
  { year: 2020, rate: 0.0612 },
  { year: 2019, rate: 0.0723 },
  { year: 2018, rate: 0.0741 },
  { year: 2017, rate: 0.0811 },
  { year: 2016, rate: 0.0743 },
  { year: 2015, rate: 0.0803 },
  { year: 2014, rate: 0.0569 },
]

const AVG_RATE =
  MP2_HISTORICAL_RATES.reduce((s, r) => s + r.rate, 0) / MP2_HISTORICAL_RATES.length

interface MP2DividendHistoryProps {
  currentRate: number
  onRateSelect: (rate: number) => void
}

type DisplayMode = 'table' | 'chart'

export function MP2DividendHistory({ currentRate, onRateSelect }: MP2DividendHistoryProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DisplayMode>('table')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">MP2 Historical Dividend Rates</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {MP2_HISTORICAL_RATES[0].year}–{MP2_HISTORICAL_RATES[MP2_HISTORICAL_RATES.length - 1].year} •{' '}
            10-yr avg:{' '}
            <span className="font-semibold text-amber-600">{(AVG_RATE * 100).toFixed(2)}%</span>
            {' '}· Click any rate to apply
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Mode toggle */}
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50/60">
            <p className="text-xs text-gray-500">
              Current rate:{' '}
              <span className="font-bold text-brand-blue">{(currentRate * 100).toFixed(2)}%</span>
            </p>
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              {(['table', 'chart'] as DisplayMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                    mode === m ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {mode === 'table' ? (
            <TableView rates={MP2_HISTORICAL_RATES} currentRate={currentRate} onSelect={onRateSelect} />
          ) : (
            <ChartView rates={MP2_HISTORICAL_RATES} currentRate={currentRate} onSelect={onRateSelect} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Table View ──────────────────────────────────────────────────────────────

function TableView({
  rates,
  currentRate,
  onSelect,
}: {
  rates: typeof MP2_HISTORICAL_RATES
  currentRate: number
  onSelect: (r: number) => void
}) {
  const maxRate = Math.max(...rates.map((r) => r.rate))

  return (
    <div className="overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Year</th>
            <th className="px-4 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
            <th className="px-5 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rates.map((item, idx) => {
            const isActive = Math.abs(item.rate - currentRate) < 0.0001
            const isHighest = item.rate === maxRate
            return (
              <tr
                key={item.year}
                className={isActive ? 'bg-blue-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
              >
                <td className="px-5 py-2.5 font-semibold text-gray-700">{item.year}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Rate bar */}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-gold"
                        style={{ width: `${(item.rate / 0.10) * 100}%` }}
                      />
                    </div>
                    <span className={`font-bold tabular-nums ${isHighest ? 'text-green-600' : isActive ? 'text-brand-blue' : 'text-gray-700'}`}>
                      {(item.rate * 100).toFixed(2)}%
                    </span>
                    {isHighest && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">High</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-2.5 text-right">
                  {isActive ? (
                    <span className="text-[10px] bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full font-semibold">
                      Applied
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(item.rate)}
                      className="text-[10px] bg-gray-100 hover:bg-brand-blue hover:text-white text-gray-600 px-2 py-0.5 rounded-full font-semibold transition-colors"
                    >
                      Use
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="px-5 py-3 text-[10px] text-gray-400 border-t border-gray-50">
        Source: Pag-IBIG Fund official announcements. Rates subject to annual board declaration.
      </p>
    </div>
  )
}

// ─── Chart View ──────────────────────────────────────────────────────────────

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-xl border border-gray-100 rounded-xl p-2 text-xs">
      <p className="font-bold text-gray-700">{label}</p>
      <p className="text-brand-blue font-semibold">{(payload[0].value * 100).toFixed(2)}%</p>
    </div>
  )
}

function ChartView({
  rates,
  currentRate,
  onSelect,
}: {
  rates: typeof MP2_HISTORICAL_RATES
  currentRate: number
  onSelect: (r: number) => void
}) {
  const sorted = [...rates].sort((a, b) => a.year - b.year)

  return (
    <div className="p-4">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={sorted}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onClick={(data) => {
            if (data?.activePayload?.[0]) {
              onSelect(data.activePayload[0].payload.rate)
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            domain={[0.04, 0.10]}
            width={35}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {sorted.map((item) => {
              const isActive = Math.abs(item.rate - currentRate) < 0.0001
              return (
                <Cell
                  key={item.year}
                  fill={isActive ? '#1e3a8a' : '#f59e0b'}
                  fillOpacity={isActive ? 1 : 0.75}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 text-center mt-1">
        Click a bar to apply that year&apos;s rate to your scenario
      </p>
    </div>
  )
}
