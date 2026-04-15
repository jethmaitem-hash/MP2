'use client'

import { YearlyRow } from '@/types'
import { formatPHP } from '@/utils/formatters'

interface YearlyBreakdownProps {
  rows: YearlyRow[]
}

export function YearlyBreakdown({ rows }: YearlyBreakdownProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Year-by-Year Breakdown</h3>
        <p className="text-xs text-gray-500 mt-0.5">Annual contribution and dividend summary</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Year
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Opening Balance
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Contributions
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-green-600 uppercase tracking-wider whitespace-nowrap">
                Div on Carried
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-green-600 uppercase tracking-wider whitespace-nowrap">
                Div on New
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-green-700 uppercase tracking-wider whitespace-nowrap">
                Total Div
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-brand-blue uppercase tracking-wider whitespace-nowrap">
                Closing Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, idx) => (
              <tr key={row.year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                  {row.year <= 5 ? `Year ${row.year}` : (
                    <span className="flex items-center gap-1.5">
                      Year {row.year}
                      <span className="text-[10px] bg-amber-100 text-amber-700 rounded px-1 py-0.5 font-bold">Partial</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                  {formatPHP(row.openingBalance)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                  {formatPHP(row.contributions)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                  +{formatPHP(row.dividendOnCarriedBalance)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                  +{formatPHP(row.dividendOnNewContributions)}
                </td>
                <td className="px-4 py-3 text-right text-green-700 font-semibold whitespace-nowrap font-mono text-xs sm:text-sm">
                  +{formatPHP(row.dividends)}
                </td>
                <td className="px-4 py-3 text-right text-brand-blue font-bold whitespace-nowrap font-mono text-xs sm:text-sm">
                  {formatPHP(row.closingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals row */}
          <tfoot>
            <tr className="bg-brand-blue/5 border-t-2 border-brand-blue/20">
              <td className="px-4 py-3 font-bold text-gray-800">Total</td>
              <td className="px-4 py-3 text-right text-gray-400 text-xs">—</td>
              <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap font-mono text-xs sm:text-sm">
                {formatPHP(rows.reduce((s, r) => s + r.contributions, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                +{formatPHP(rows.reduce((s, r) => s + r.dividendOnCarriedBalance, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-600 whitespace-nowrap font-mono text-xs sm:text-sm">
                +{formatPHP(rows.reduce((s, r) => s + r.dividendOnNewContributions, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-700 whitespace-nowrap font-mono text-xs sm:text-sm">
                +{formatPHP(rows.reduce((s, r) => s + r.dividends, 0))}
              </td>
              <td className="px-4 py-3 text-right font-bold text-brand-blue whitespace-nowrap font-mono text-xs sm:text-sm">
                {formatPHP(rows[rows.length - 1]?.closingBalance ?? 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
