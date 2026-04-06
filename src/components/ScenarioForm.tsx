'use client'

import { useState, useCallback } from 'react'
import { parseISO, getYear, getMonth } from 'date-fns'
import {
  ScenarioInput,
  StoreAction,
  FixedFrequency,
  ContributionMode,
  FlexibleContribution,
} from '@/types'
import { InfoTooltip, MP2InfoBox } from './MP2Tooltip'
import { formatPHP } from '@/utils/formatters'

interface ScenarioFormProps {
  scenario: ScenarioInput
  dispatch: React.Dispatch<StoreAction>
  canDelete: boolean
  canDuplicate: boolean
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function ScenarioForm({ scenario, dispatch, canDelete, canDuplicate }: ScenarioFormProps) {
  const [showActual, setShowActual] = useState(
    (scenario.actualContributions ?? []).length > 0
  )

  function update(changes: Partial<ScenarioInput>) {
    dispatch({ type: 'UPDATE_SCENARIO', payload: { id: scenario.id, ...changes } })
  }

  // ── contribution helpers ──────────────────────────────────────────────────

  function getContribValue(list: FlexibleContribution[], yyyyMM: string) {
    return list.find((c) => c.date === yyyyMM)?.amount ?? 0
  }

  const setContribValue = useCallback(
    (field: 'contributions' | 'actualContributions', yyyyMM: string, amount: number) => {
      const list = scenario[field] ?? []
      if (amount <= 0) {
        update({ [field]: list.filter((c) => c.date !== yyyyMM) })
      } else {
        const existing = list.find((c) => c.date === yyyyMM)
        if (existing) {
          update({ [field]: list.map((c) => c.date === yyyyMM ? { ...c, amount } : c) })
        } else {
          update({ [field]: [...list, { id: Math.random().toString(36).slice(2), date: yyyyMM, amount }] })
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenario.contributions, scenario.actualContributions, scenario.id]
  )

  // ── year range for grid ───────────────────────────────────────────────────
  const startDate = parseISO(scenario.startDate)
  const startYear = getYear(startDate)
  const startMonth = getMonth(startDate) // 0-indexed
  const years = [0, 1, 2, 3, 4].map((i) => startYear + i)

  const totalPlanned = scenario.contributions.reduce((s, c) => s + c.amount, 0)
  const totalActual  = (scenario.actualContributions ?? []).reduce((s, c) => s + c.amount, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
      {/* ── Scenario name + actions ── */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Scenario Name
          </label>
          <input
            type="text"
            value={scenario.name}
            onChange={(e) => update({ name: e.target.value })}
            maxLength={40}
            className="w-full text-lg font-bold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 focus:border-brand-blue focus:outline-none pb-1 transition-colors"
            placeholder="e.g. MP2 Plan A"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-5">
          {canDuplicate && (
            <button type="button"
              onClick={() => dispatch({ type: 'DUPLICATE_SCENARIO', payload: { id: scenario.id } })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Duplicate scenario"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button type="button"
              onClick={() => confirm(`Delete "${scenario.name}"?`) && dispatch({ type: 'DELETE_SCENARIO', payload: { id: scenario.id } })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete scenario"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* ── 5-Year badge ── */}
        <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-xl border border-blue-100">
          <svg className="w-4 h-4 text-brand-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-brand-blue font-semibold">5-Year Investment Period</span>
          <span className="ml-auto text-[10px] bg-brand-gold text-white px-1.5 py-0.5 rounded font-bold">MP2</span>
        </div>

        {/* ── Contribution Mode toggle ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Contribution Type
              <InfoTooltip content="Fixed: same amount every month or year. Flexible: define exact amounts per month using the grid." />
            </label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(['fixed', 'flexible'] as ContributionMode[]).map((mode) => (
                <button key={mode} type="button"
                  onClick={() => update({ contributionMode: mode })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                    scenario.contributionMode === mode
                      ? 'bg-white text-brand-blue shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Fixed mode */}
          {scenario.contributionMode === 'fixed' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['monthly', 'yearly'] as FixedFrequency[]).map((freq) => (
                  <button key={freq} type="button"
                    onClick={() => update({ fixedFrequency: freq })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                      scenario.fixedFrequency === freq
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {freq === 'monthly' ? 'Monthly' : 'Once a Year'}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₱</span>
                <input
                  type="number" min={0} step={100}
                  value={scenario.fixedAmount}
                  onChange={(e) => update({ fixedAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-gray-400">
                {scenario.fixedFrequency === 'monthly'
                  ? `≈ ${formatPHP(scenario.fixedAmount * 12)} per year`
                  : `≈ ${formatPHP(scenario.fixedAmount / 12)} per month`}
              </p>
            </div>
          )}

          {/* Flexible mode — contribution grid */}
          {scenario.contributionMode === 'flexible' && (
            <div className="space-y-3">
              {/* Summary row */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Planned total:{' '}
                  <span className="font-bold text-gray-800">{formatPHP(totalPlanned)}</span>
                </span>
                <button type="button"
                  onClick={() => update({ contributions: [] })}
                  className="text-red-400 hover:text-red-600 text-xs transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* Grid */}
              <ContributionGrid
                years={years}
                startMonth={startMonth}
                planned={scenario.contributions}
                actual={showActual ? scenario.actualContributions : null}
                onChange={(yyyyMM, amount) => setContribValue('contributions', yyyyMM, amount)}
                onActualChange={(yyyyMM, amount) => setContribValue('actualContributions', yyyyMM, amount)}
                getPlanned={(yyyyMM) => getContribValue(scenario.contributions, yyyyMM)}
                getActual={(yyyyMM) => getContribValue(scenario.actualContributions, yyyyMM)}
              />

              {/* Actual toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setShowActual((v) => !v)}
                    className={`relative w-8 h-4 rounded-full transition-colors ${showActual ? 'bg-brand-blue' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showActual ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Track actual contributions</span>
                </label>
                {showActual && totalActual > 0 && (
                  <span className="text-xs text-gray-500">
                    Actual: <span className="font-bold text-gray-800">{formatPHP(totalActual)}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Dividend Rate ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Dividend Rate (%)
              <InfoTooltip content="Expected annual dividend rate. MP2 historical rates: 5.69%–8.11%. Default is 6%." />
            </label>
            {/* Per-year toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div
                onClick={() => {
                  if (scenario.dividendRates && scenario.dividendRates.length > 0) {
                    update({ dividendRates: undefined })
                  } else {
                    update({ dividendRates: Array(5).fill(scenario.dividendRate) })
                  }
                }}
                className={`relative w-8 h-4 rounded-full transition-colors ${scenario.dividendRates && scenario.dividendRates.length > 0 ? 'bg-brand-blue' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${scenario.dividendRates && scenario.dividendRates.length > 0 ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">Per-year rates</span>
            </label>
          </div>

          {/* Single rate mode */}
          {!(scenario.dividendRates && scenario.dividendRates.length > 0) && (
            <div className="relative">
              <input
                type="number" min={0} max={20} step={0.01}
                value={(scenario.dividendRate * 100).toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  update({ dividendRate: Math.min(20, Math.max(0, val)) / 100 })
                }}
                className="w-full pr-8 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">%</span>
            </div>
          )}

          {/* Per-year rate inputs */}
          {scenario.dividendRates && scenario.dividendRates.length > 0 && (
            <div className="space-y-1.5">
              {scenario.dividendRates.map((rate, i) => {
                const calYear = years[i]
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                      Year {i + 1} <span className="text-gray-400">({calYear})</span>
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="number" min={0} max={20} step={0.01}
                        value={(rate * 100).toFixed(2)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          const updated = [...(scenario.dividendRates ?? [])]
                          updated[i] = Math.min(20, Math.max(0, val)) / 100
                          update({ dividendRates: updated })
                        }}
                        className="w-full pr-7 pl-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">%</span>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 pt-0.5">
                Avg:{' '}
                <span className="font-semibold text-gray-600">
                  {((scenario.dividendRates.reduce((s, r) => s + r, 0) / scenario.dividendRates.length) * 100).toFixed(2)}%
                </span>
              </p>
            </div>
          )}
        </div>

        {/* ── Start Date ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Start Date
            <InfoTooltip content="Month you open your MP2 account. Contributions begin from this month." />
          </label>
          <input
            type="date"
            value={scenario.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-brand-blue focus:ring-2 focus:ring-blue-100 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <MP2InfoBox />
    </div>
  )
}

// ─── Contribution Grid ────────────────────────────────────────────────────────
// 12 rows (Jan–Dec) × 5 year columns, each cell = one month's contribution

interface ContributionGridProps {
  years: number[]
  startMonth: number           // 0-indexed
  planned: FlexibleContribution[]
  actual: FlexibleContribution[] | null
  onChange: (yyyyMM: string, amount: number) => void
  onActualChange: (yyyyMM: string, amount: number) => void
  getPlanned: (yyyyMM: string) => number
  getActual: (yyyyMM: string) => number
}

function ContributionGrid({
  years,
  startMonth,
  actual,
  onChange,
  onActualChange,
  getPlanned,
  getActual,
}: ContributionGridProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-brand-blue text-white">
            <th className="px-2 py-2 text-left font-semibold w-10 sticky left-0 bg-brand-blue z-10">Mo</th>
            {years.map((yr) => (
              <th key={yr} className="px-1 py-2 text-center font-semibold w-28">
                {actual ? (
                  <div className="flex flex-col gap-0.5">
                    <span>{yr}</span>
                    <div className="flex gap-1 justify-center text-[10px]">
                      <span className="bg-blue-200/40 rounded px-1 font-medium">Plan</span>
                      <span className="bg-amber-200/40 rounded px-1 font-medium">Actual</span>
                    </div>
                  </div>
                ) : yr}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MONTH_NAMES.map((mon, mIdx) => {
            const calMonth = mIdx + 1
            const rowBg = mIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
            return (
              <tr key={mon} className={rowBg}>
                {/* Month label */}
                <td className={`px-2 py-1 font-semibold sticky left-0 z-10 ${rowBg} ${mIdx === 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mon}
                </td>
                {years.map((yr, yrIdx) => {
                  const yyyyMM = `${yr}-${String(calMonth).padStart(2, '0')}`
                  const disabled = yrIdx === 0 && mIdx < startMonth
                  const planVal = getPlanned(yyyyMM)
                  const actualVal = getActual(yyyyMM)

                  if (disabled) {
                    return (
                      <td key={yr} className="px-1 py-1">
                        <div className="flex flex-col gap-1">
                          <div className="h-8 bg-gray-100 rounded opacity-40" />
                          {actual && <div className="h-8 bg-gray-100 rounded opacity-40" />}
                        </div>
                      </td>
                    )
                  }

                  return (
                    <td key={yr} className="px-1 py-1">
                      {actual ? (
                        <div className="flex flex-col gap-1">
                          <CellInput
                            value={planVal}
                            onChange={(v) => onChange(yyyyMM, v)}
                            color="blue"
                          />
                          <CellInput
                            value={actualVal}
                            onChange={(v) => onActualChange(yyyyMM, v)}
                            color="amber"
                          />
                        </div>
                      ) : (
                        <CellInput
                          value={planVal}
                          onChange={(v) => onChange(yyyyMM, v)}
                          color="blue"
                          wide
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
        {/* Column totals */}
        <tfoot>
          <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
            <td className="px-2 py-1.5 text-gray-600 sticky left-0 bg-gray-100 z-10 text-[10px]">Total</td>
            {years.map((yr) => {
              let planTotal = 0
              let actualTotal = 0
              for (let m = 1; m <= 12; m++) {
                const key = `${yr}-${String(m).padStart(2, '0')}`
                planTotal += getPlanned(key)
                actualTotal += getActual(key)
              }
              return (
                <td key={yr} className="px-1 py-1.5">
                  {actual ? (
                    <div className="flex flex-col gap-0.5 items-center">
                      <span className="text-xs text-blue-700 font-bold">
                        {planTotal > 0 ? `₱${(planTotal/1000).toFixed(0)}K` : '—'}
                      </span>
                      <span className="text-xs text-amber-600 font-bold">
                        {actualTotal > 0 ? `₱${(actualTotal/1000).toFixed(0)}K` : '—'}
                      </span>
                    </div>
                  ) : (
                    <span className="block text-center text-xs text-blue-700 font-bold">
                      {planTotal > 0 ? `₱${(planTotal/1000).toFixed(0)}K` : '—'}
                    </span>
                  )}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

interface CellInputProps {
  value: number
  onChange: (v: number) => void
  color: 'blue' | 'amber'
  wide?: boolean
}

function CellInput({ value, onChange, color, wide }: CellInputProps) {
  const ring = color === 'blue' ? 'focus:ring-blue-300 focus:border-brand-blue' : 'focus:ring-amber-300 focus:border-amber-400'
  const filled = color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-amber-100 text-amber-700 border-amber-300'
  const empty = color === 'blue' ? 'bg-blue-50/40 text-gray-400 border-blue-200' : 'bg-amber-50/40 text-gray-400 border-amber-200'

  return (
    <input
      type="number"
      min={0}
      step={500}
      value={value || ''}
      placeholder="—"
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={`w-full h-8 px-1 text-xs font-semibold text-center border rounded focus:outline-none focus:ring-1 transition-colors placeholder:text-gray-300
        ${value > 0 ? filled : empty}
        ${ring} ${wide ? '' : ''}`}
    />
  )
}
