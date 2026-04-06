'use client'

import { ScenarioResult } from '@/types'
import { formatPHP } from '@/utils/formatters'

interface SummaryCardsProps {
  result: ScenarioResult
}

export function SummaryCards({ result }: SummaryCardsProps) {
  const roi =
    result.totalContributions > 0
      ? ((result.totalDividends / result.totalContributions) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <MetricCard
        label="Total Invested"
        value={formatPHP(result.totalContributions)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        subtext="Your total contributions"
      />
      <MetricCard
        label="Total Dividends"
        value={formatPHP(result.totalDividends)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
        iconBg="bg-green-100"
        iconColor="text-green-600"
        subtext={`+${roi}% return on investment`}
        highlight
      />
      <MetricCard
        label="Maturity Value"
        value={formatPHP(result.maturityValue)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        subtext="What you receive at maturity"
        gold
      />
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  subtext: string
  highlight?: boolean
  gold?: boolean
}

function MetricCard({ label, value, icon, iconBg, iconColor, subtext, highlight, gold }: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm border flex items-start gap-3 ${
        gold
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100'
          : highlight
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-lg sm:text-xl font-bold mt-0.5 truncate ${gold ? 'text-amber-700' : highlight ? 'text-green-700' : 'text-gray-900'}`}>
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
      </div>
    </div>
  )
}
