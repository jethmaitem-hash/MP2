'use client'

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ScenarioInput, ScenarioResult } from '@/types'
import { calculateScenario } from '@/lib/calculations'
import { formatPHP, formatPercent } from '@/utils/formatters'

const PALETTE = ['#1e3a8a', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444']

interface ComparisonViewProps {
  scenarios: ScenarioInput[]
}

interface ComparisonEntry {
  scenario: ScenarioInput
  result: ScenarioResult
  color: string
}

interface ChartPoint {
  label: string
  [key: string]: number | string
}

function buildComparisonData(entries: ComparisonEntry[]): ChartPoint[] {
  // All scenarios are 5 years
  const maxPeriod = 5

  const points: ChartPoint[] = [{ label: 'Start' }]
  for (let yr = 1; yr <= maxPeriod; yr++) {
    const point: ChartPoint = { label: `Yr ${yr}` }
    for (const entry of entries) {
      const row = entry.result.yearlyBreakdown.find((r) => r.year === yr)
      if (row) {
        point[entry.scenario.id] = row.closingBalance
      }
    }
    points.push(point)
  }
  return points
}

const CustomTooltip = ({
  active,
  payload,
  label,
  entries,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: string
  entries: ComparisonEntry[]
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white shadow-xl border border-gray-100 rounded-xl p-3 text-xs">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload
        .sort((a, b) => b.value - a.value)
        .map((item) => {
          const entry = entries.find((e) => e.scenario.id === item.dataKey)
          return (
            <div key={item.dataKey} className="flex items-center justify-between gap-4 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-gray-600">{entry?.scenario.name ?? item.dataKey}</span>
              </span>
              <span className="font-semibold text-gray-900">{formatPHP(item.value)}</span>
            </div>
          )
        })}
    </div>
  )
}

export function ComparisonView({ scenarios }: ComparisonViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const entries: ComparisonEntry[] = scenarios.map((s, i) => ({
    scenario: s,
    result: calculateScenario(s),
    color: PALETTE[i % PALETTE.length],
  }))

  const best = entries.reduce(
    (b, e) => (e.result.maturityValue > b.result.maturityValue ? e : b),
    entries[0]
  )

  const chartData = buildComparisonData(entries)

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No scenarios to compare.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Best Result Banner */}
      <div className="bg-gradient-to-r from-brand-blue to-blue-700 rounded-2xl p-4 sm:p-5 text-white flex items-center gap-4">
        <div className="p-2.5 bg-brand-gold rounded-xl flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Best Scenario</p>
          <p className="text-white font-bold text-lg leading-tight">{best.scenario.name}</p>
          <p className="text-blue-100 text-sm">
            Maturity Value:{' '}
            <span className="font-bold text-brand-gold">{formatPHP(best.result.maturityValue)}</span>
          </p>
        </div>
      </div>

      {/* Overlay Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Growth Comparison</h3>
          <p className="text-xs text-gray-500 mt-0.5">All scenarios — maturity value over time</p>
        </div>
        <div className="p-4 sm:p-5">
          {mounted ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1_000_000 ? `₱${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `₱${(v / 1000).toFixed(0)}K` : `₱${v}`
                  }
                  width={65}
                />
                <Tooltip content={<CustomTooltip entries={entries} />} />
                {entries.map((entry) => (
                  <Line
                    key={entry.scenario.id}
                    type="monotone"
                    dataKey={entry.scenario.id}
                    name={entry.scenario.name}
                    stroke={entry.color}
                    strokeWidth={entry.scenario.id === best.scenario.id ? 3 : 2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    strokeDasharray={entry.scenario.id === best.scenario.id ? undefined : '5 3'}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 bg-gray-50 rounded-xl animate-pulse" />
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-4 justify-center">
            {entries.map((entry) => (
              <div key={entry.scenario.id} className="flex items-center gap-1.5">
                <svg width="20" height="10">
                  <line
                    x1="0"
                    y1="5"
                    x2="20"
                    y2="5"
                    stroke={entry.color}
                    strokeWidth={entry.scenario.id === best.scenario.id ? 3 : 2}
                    strokeDasharray={entry.scenario.id === best.scenario.id ? undefined : '4 2'}
                  />
                </svg>
                <span className={`text-xs ${entry.scenario.id === best.scenario.id ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                  {entry.scenario.name}
                  {entry.scenario.id === best.scenario.id && (
                    <span className="ml-1 text-[10px] bg-brand-gold text-white px-1 rounded">Best</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Side-by-Side Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Monthly Equiv.
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Period
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Invested
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-green-600 uppercase tracking-wider whitespace-nowrap">
                  Dividends
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-brand-blue uppercase tracking-wider whitespace-nowrap">
                  Maturity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry, idx) => {
                // Monthly equivalent contribution
                const monthly =
                  entry.scenario.contributionMode === 'fixed'
                    ? entry.scenario.fixedFrequency === 'monthly'
                      ? entry.scenario.fixedAmount
                      : entry.scenario.fixedAmount / 12
                    : entry.result.totalContributions / 60 // avg over 60 months
                const isBest = entry.scenario.id === best.scenario.id
                return (
                  <tr
                    key={entry.scenario.id}
                    className={isBest ? 'bg-blue-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: entry.color }}
                        />
                        <span className={`font-semibold ${isBest ? 'text-brand-blue' : 'text-gray-700'}`}>
                          {entry.scenario.name}
                        </span>
                        {isBest && (
                          <span className="text-[10px] bg-brand-gold text-white px-1.5 py-0.5 rounded font-bold">
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap font-mono text-xs">
                      {formatPHP(monthly)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap text-xs">
                      5yr
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap text-xs">
                      {formatPercent(entry.scenario.dividendRate)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap font-mono text-xs">
                      {formatPHP(entry.result.totalContributions)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold whitespace-nowrap font-mono text-xs">
                      +{formatPHP(entry.result.totalDividends)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap font-mono text-xs ${isBest ? 'text-brand-blue' : 'text-gray-800'}`}>
                      {formatPHP(entry.result.maturityValue)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
