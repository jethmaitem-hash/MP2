'use client'

import { useState } from 'react'
import { MonthlyRow } from '@/types'
import { formatPHP } from '@/utils/formatters'

interface MonthlyBreakdownProps {
  rows: MonthlyRow[]
  highestMonth: { label: string; amount: number } | null
  totalContributionMonths: number
}

export function MonthlyBreakdown({ rows, highestMonth, totalContributionMonths }: MonthlyBreakdownProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(1)

  // Group rows by relative year
  const years = Array.from(new Set(rows.map((r) => r.year))).sort()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Monthly Breakdown</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Month-by-month simulation — dividends credited at end of each year block
        </p>
      </div>

      {/* Legend */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300" />
          Est. monthly dividend accrual (prorated)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-[10px] bg-green-500 text-white px-1 rounded font-bold">Div</span>
          Actual dividend credited at year-end
        </div>
      </div>

      {/* Smart UX insights bar */}
      {(highestMonth || totalContributionMonths > 0) && (
        <div className="px-5 py-3 bg-blue-50/60 border-b border-blue-100 flex flex-wrap gap-3">
          {totalContributionMonths > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-brand-blue" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-800">{totalContributionMonths}</span> month
                {totalContributionMonths !== 1 ? 's' : ''} with contributions
              </span>
            </div>
          )}
          {highestMonth && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-brand-gold" />
              <span className="text-gray-600">
                Highest:{' '}
                <span className="font-semibold text-gray-800">{highestMonth.label}</span> —{' '}
                <span className="font-semibold text-green-700">{formatPHP(highestMonth.amount)}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Year accordion */}
      <div className="divide-y divide-gray-50">
        {years.map((yr) => {
          const yearRows = rows.filter((r) => r.year === yr)
          const yearTotal = yearRows.reduce((s, r) => s + r.contribution, 0)
          const yearDividend = yearRows.reduce((s, r) => s + r.dividendAccrued, 0)
          const yearEstimate = yearRows.reduce((s, r) => s + r.monthlyDividendEstimate, 0)
          const yearClose = yearRows[yearRows.length - 1]?.closingBalance ?? 0
          const isOpen = expandedYear === yr

          return (
            <div key={yr}>
              {/* Year header (accordion toggle) */}
              <button
                type="button"
                onClick={() => setExpandedYear(isOpen ? null : yr)}
                className="w-full flex items-center px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="w-16 text-xs font-bold text-brand-blue">Year {yr}</span>
                <span className="flex-1 text-xs text-gray-500">
                  {yearRows.length} months · Contributions:{' '}
                  <span className="font-semibold text-gray-700">{formatPHP(yearTotal)}</span>
                </span>
                <span className="text-xs text-green-600 mr-4">
                  <span className="font-normal">est.</span>{' '}
                  <span className="font-semibold">+{formatPHP(yearEstimate)}</span>
                  {' · '}
                  <span className="font-normal">credited</span>{' '}
                  <span className="font-bold">+{formatPHP(yearDividend)}</span>
                </span>
                <span className="text-xs font-bold text-brand-blue mr-4">
                  {formatPHP(yearClose)}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Month rows (shown when expanded) */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="px-5 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                          Month
                        </th>
                        <th className="px-4 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                          Opening
                        </th>
                        <th className="px-4 py-2 text-right text-gray-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                          Contribution
                        </th>
                        <th className="px-4 py-2 text-right text-green-600 font-semibold uppercase tracking-wider whitespace-nowrap">
                          Est. Dividend/mo
                        </th>
                        <th className="px-4 py-2 text-right text-green-700 font-semibold uppercase tracking-wider whitespace-nowrap">
                          Credited
                        </th>
                        <th className="px-4 py-2 text-right text-brand-blue font-semibold uppercase tracking-wider whitespace-nowrap">
                          Closing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {yearRows.map((row, idx) => {
                        const isHighest =
                          highestMonth?.label === row.label && highestMonth.amount === row.contribution
                        const hasDividend = row.dividendAccrued > 0

                        return (
                          <tr
                            key={`${row.calendarYear}-${row.calendarMonth}`}
                            className={
                              hasDividend
                                ? 'bg-green-50/40'
                                : isHighest
                                ? 'bg-amber-50/40'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-gray-50/30'
                            }
                          >
                            {/* Month label */}
                            <td className="px-5 py-2 font-medium text-gray-700 whitespace-nowrap">
                              {row.label}
                              {isHighest && (
                                <span className="ml-1.5 text-[10px] bg-brand-gold text-white px-1 rounded">
                                  Top
                                </span>
                              )}
                              {hasDividend && (
                                <span className="ml-1.5 text-[10px] bg-green-500 text-white px-1 rounded">
                                  Div
                                </span>
                              )}
                            </td>

                            {/* Opening balance */}
                            <td className="px-4 py-2 text-right text-gray-500 font-mono whitespace-nowrap">
                              {formatPHP(row.openingBalance)}
                            </td>

                            {/* Contribution */}
                            <td className={`px-4 py-2 text-right font-mono whitespace-nowrap ${row.contribution > 0 ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>
                              {row.contribution > 0 ? formatPHP(row.contribution) : '—'}
                            </td>

                            {/* Estimated monthly dividend accrual */}
                            <td className="px-4 py-2 text-right font-mono whitespace-nowrap">
                              <span className="text-green-600">
                                +{formatPHP(row.monthlyDividendEstimate)}
                              </span>
                            </td>

                            {/* Actual credited dividend (year-end only) */}
                            <td className="px-4 py-2 text-right font-mono whitespace-nowrap">
                              {hasDividend ? (
                                <span className="text-green-700 font-bold">
                                  +{formatPHP(row.dividendAccrued)}
                                </span>
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </td>

                            {/* Closing balance */}
                            <td className="px-4 py-2 text-right text-brand-blue font-bold font-mono whitespace-nowrap">
                              {formatPHP(row.closingBalance)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
