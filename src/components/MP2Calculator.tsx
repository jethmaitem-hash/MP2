'use client'

import { useMemo } from 'react'
import { useScenarioStore } from '@/store/scenarioStore'
import { calculateScenario } from '@/lib/calculations'
import { formatPHP } from '@/utils/formatters'
import { Navigation } from './Navigation'
import { ScenarioTabs } from './ScenarioTabs'
import { ScenarioForm } from './ScenarioForm'
import { SummaryCards } from './SummaryCards'
import { YearlyBreakdown } from './YearlyBreakdown'
import { MonthlyBreakdown } from './MonthlyBreakdown'
import { GrowthChart } from './GrowthChart'
import { ComparisonView } from './ComparisonView'
import { PDFExportButton } from './PDFExportButton'
import { MP2DividendHistory } from './MP2DividendHistory'

export function MP2Calculator() {
  const { state, dispatch, hydrated, activeScenario, canAdd, maxScenarios } =
    useScenarioStore()

  const result = useMemo(() => calculateScenario(activeScenario), [activeScenario])

  function setRate(rate: number) {
    dispatch({ type: 'UPDATE_SCENARIO', payload: { id: activeScenario.id, dividendRate: rate } })
  }

  // Skeleton while hydrating
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-14 bg-brand-blue" />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-64" />
          <div className="h-40 bg-white rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeTab={state.activeTab}
        onTabChange={(tab) => dispatch({ type: 'SET_TAB', payload: { tab } })}
      />

      <ScenarioTabs
        scenarios={state.scenarios}
        activeId={state.activeId}
        canAdd={canAdd}
        maxScenarios={maxScenarios}
        dispatch={dispatch}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {state.activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 sm:gap-6">
            {/* ── Left: Inputs ── */}
            <div className="space-y-4">
              <ScenarioForm
                scenario={activeScenario}
                dispatch={dispatch}
                canDelete={state.scenarios.length > 1}
                canDuplicate={canAdd}
              />

              {/* Historical dividend rates — click to fill */}
              <MP2DividendHistory
                currentRate={activeScenario.dividendRate}
                onRateSelect={setRate}
              />

              {/* Reset button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset all scenarios to defaults?')) {
                      dispatch({ type: 'RESET' })
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset to defaults
                </button>
              </div>
            </div>

            {/* ── Right: Output ── */}
            <div className="space-y-5">
              {/* Action row */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{activeScenario.name}</h2>
                  <p className="text-xs text-gray-400">5-year MP2 projection</p>
                </div>
                <PDFExportButton scenario={activeScenario} result={result} />
              </div>

              <SummaryCards result={result} />

              {/* Smart UX insights */}
              <ContributionInsights result={result} />

              <GrowthChart
                yearlyRows={result.yearlyBreakdown}
                monthlyRows={result.monthlyBreakdown}
                actualContributions={activeScenario.actualContributions}
                name={activeScenario.name}
              />

              <YearlyBreakdown rows={result.yearlyBreakdown} />

              <MonthlyBreakdown
                rows={result.monthlyBreakdown}
                highestMonth={result.highestContributionMonth}
                totalContributionMonths={result.totalContributionMonths}
              />

              <p className="text-xs text-gray-400 text-center pb-4">
                Estimate only. MP2 dividends depend on Pag-IBIG Fund&apos;s annual board-declared rates.
                Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        ) : (
          <ComparisonView scenarios={state.scenarios} />
        )}
      </main>
    </div>
  )
}

// ─── Smart UX Insights Strip ─────────────────────────────────────────────────

function ContributionInsights({
  result,
}: {
  result: ReturnType<typeof calculateScenario>
}) {
  const roi =
    result.totalContributions > 0
      ? ((result.totalDividends / result.totalContributions) * 100).toFixed(1)
      : '0'

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex flex-wrap gap-x-5 gap-y-2">
      <Insight
        icon="💰"
        label="You contributed a total of"
        value={formatPHP(result.totalContributions)}
        highlight
      />
      {result.totalContributionMonths > 0 && (
        <Insight
          icon="📅"
          label="Over"
          value={`${result.totalContributionMonths} month${result.totalContributionMonths !== 1 ? 's' : ''}`}
        />
      )}
      {result.highestContributionMonth && (
        <Insight
          icon="⬆️"
          label="Highest month"
          value={`${result.highestContributionMonth.label} (${formatPHP(result.highestContributionMonth.amount)})`}
        />
      )}
      <Insight icon="📈" label="Return on investment" value={`+${roi}%`} highlight />
    </div>
  )
}

function Insight({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span>{icon}</span>
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${highlight ? 'text-brand-blue' : 'text-gray-700'}`}>{value}</span>
    </div>
  )
}
