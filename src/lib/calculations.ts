import { ScenarioInput, ScenarioResult, YearlyRow, MonthlyRow } from '@/types'
import { parseISO, getYear, getMonth, format } from 'date-fns'

/**
 * Build a Map<'YYYY-MM', amount> from the scenario's contribution inputs.
 */
function buildContribMap(input: ScenarioInput): Map<string, number> {
  const map = new Map<string, number>()

  if (input.contributionMode === 'fixed') {
    const startDate = parseISO(input.startDate)
    const startYear = getYear(startDate)
    const startMonth = getMonth(startDate) + 1 // 1-indexed

    for (let relYear = 0; relYear < 5; relYear++) {
      const calYear = startYear + relYear
      const firstMonth = relYear === 0 ? startMonth : 1

      for (let m = firstMonth; m <= 12; m++) {
        const key = `${calYear}-${String(m).padStart(2, '0')}`
        if (input.fixedFrequency === 'monthly') {
          map.set(key, input.fixedAmount)
        } else {
          // Yearly: lump-sum on the same month as start date each year
          if (m === startMonth) {
            map.set(key, input.fixedAmount)
          }
        }
      }
    }
  } else {
    for (const c of input.contributions) {
      map.set(c.date, (map.get(c.date) ?? 0) + c.amount)
    }
  }

  return map
}

/**
 * Calculate MP2 savings using the exact Pag-IBIG dividend formula.
 *
 * ─ Dividend formula (per the official tabulation) ─────────────────────────
 *
 *   1. Carried balance (from prior year-end) earns a full-year dividend:
 *        dividendOnCarried = openingBalance × rate
 *
 *   2. Each new contribution made in calendar month M earns a prorated dividend
 *      for the remaining months of that calendar year (inclusive of month M):
 *        dividendOnContrib = amount × rate × (13 − M) / 12
 *
 *   Total year dividend = dividendOnCarried + Σ dividendOnContrib
 *
 * The calculation runs for 5 calendar years starting from the startDate year.
 * In the first year, contributions begin from the start month.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const startDate = parseISO(input.startDate)
  const startYear = getYear(startDate)
  const startMonth = getMonth(startDate) + 1 // 1-indexed

  const contribMap = buildContribMap(input)

  const monthlyRows: MonthlyRow[] = []
  const yearlyRows: YearlyRow[] = []

  let carriedBalance = 0

  for (let relYear = 1; relYear <= 5; relYear++) {
    const calYear = startYear + relYear - 1
    const yearOpeningBalance = carriedBalance
    const firstMonth = relYear === 1 ? startMonth : 1

    // Dividend on the balance carried from the prior year-end
    const dividendOnCarried = yearOpeningBalance * input.dividendRate

    let yearContribs = 0
    let dividendOnNew = 0
    let cumContribsInYear = 0

    const yearMonthRows: MonthlyRow[] = []

    for (let m = firstMonth; m <= 12; m++) {
      const key = `${calYear}-${String(m).padStart(2, '0')}`
      const contrib = contribMap.get(key) ?? 0

      cumContribsInYear += contrib
      yearContribs += contrib

      // Prorated dividend for this contribution for the rest of this calendar year
      const divOnContrib = contrib * input.dividendRate * (13 - m) / 12
      dividendOnNew += divOnContrib

      const isLastMonth = m === 12
      const runningBalance = yearOpeningBalance + cumContribsInYear
      const dividendAccrued = isLastMonth
        ? dividendOnCarried + dividendOnNew
        : 0
      const closingBalance = runningBalance + dividendAccrued

      // Monthly estimate: prorated accrual on running balance (for display)
      const monthlyDividendEstimate =
        (yearOpeningBalance * input.dividendRate) / 12 + divOnContrib

      yearMonthRows.push({
        year: relYear,
        calendarYear: calYear,
        calendarMonth: m,
        label: format(new Date(calYear, m - 1, 1), 'MMM yyyy'),
        openingBalance: yearOpeningBalance,
        contribution: contrib,
        dividendOnContribution: divOnContrib,
        monthlyDividendEstimate,
        dividendAccrued,
        runningBalance,
        closingBalance,
      })
    }

    const totalYearDividend = dividendOnCarried + dividendOnNew
    carriedBalance = yearOpeningBalance + yearContribs + totalYearDividend

    monthlyRows.push(...yearMonthRows)

    yearlyRows.push({
      year: relYear,
      calendarYear: calYear,
      openingBalance: yearOpeningBalance,
      contributions: yearContribs,
      dividendOnCarriedBalance: dividendOnCarried,
      dividendOnNewContributions: dividendOnNew,
      dividends: totalYearDividend,
      closingBalance: carriedBalance,
    })
  }

  const totalContributions = yearlyRows.reduce((s, r) => s + r.contributions, 0)
  const totalDividends = yearlyRows.reduce((s, r) => s + r.dividends, 0)

  // Smart UX: find highest contribution month
  let highestContributionMonth: { label: string; amount: number } | null = null
  let highestAmount = 0
  let totalContributionMonths = 0

  for (const row of monthlyRows) {
    if (row.contribution > 0) {
      totalContributionMonths++
      if (row.contribution > highestAmount) {
        highestAmount = row.contribution
        highestContributionMonth = { label: row.label, amount: row.contribution }
      }
    }
  }

  return {
    totalContributions,
    totalDividends,
    maturityValue: carriedBalance,
    yearlyBreakdown: yearlyRows,
    monthlyBreakdown: monthlyRows,
    highestContributionMonth,
    totalContributionMonths,
  }
}
