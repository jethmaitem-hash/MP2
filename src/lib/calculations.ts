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

  // Per-year rate helper: uses dividendRates[i] if available, else falls back to dividendRate
  const getRateForYear = (relYear: number): number =>
    (input.dividendRates && input.dividendRates.length >= relYear)
      ? input.dividendRates[relYear - 1]
      : input.dividendRate

  const monthlyRows: MonthlyRow[] = []
  const yearlyRows: YearlyRow[] = []

  let carriedBalance = 0

  for (let relYear = 1; relYear <= 5; relYear++) {
    const calYear = startYear + relYear - 1
    const yearOpeningBalance = carriedBalance
    const firstMonth = relYear === 1 ? startMonth : 1
    const yearRate = getRateForYear(relYear)

    // Dividend on the balance carried from the prior year-end
    const dividendOnCarried = yearOpeningBalance * yearRate

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
      const divOnContrib = contrib * yearRate * (13 - m) / 12
      dividendOnNew += divOnContrib

      const isLastMonth = m === 12
      const runningBalance = yearOpeningBalance + cumContribsInYear
      const dividendAccrued = isLastMonth
        ? dividendOnCarried + dividendOnNew
        : 0
      const closingBalance = runningBalance + dividendAccrued

      // Monthly estimate: prorated accrual on running balance (for display)
      const monthlyDividendEstimate =
        (yearOpeningBalance * yearRate) / 12 + divOnContrib

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

  // ── Partial 6th year ──────────────────────────────────────────────────────
  // If savings started mid-year (e.g., April), the 5 calendar years only cover
  // 57 months. Add the remaining months (Jan to startMonth-1 of year 6) to
  // complete the full 60-month term.
  if (startMonth > 1) {
    const calYear6 = startYear + 5
    const partialEndMonth = startMonth - 1          // e.g., 3 for an April start
    const yearRate6 = getRateForYear(6)             // falls back to dividendRate
    const year6Opening = carriedBalance

    // Carried balance earns prorated dividend for the partial months
    const dividendOnCarried6 = year6Opening * yearRate6 * partialEndMonth / 12

    let yearContribs6 = 0
    let dividendOnNew6 = 0

    for (let m = 1; m <= partialEndMonth; m++) {
      const key = `${calYear6}-${String(m).padStart(2, '0')}`
      const contrib = contribMap.get(key) ?? 0
      yearContribs6 += contrib

      // Dividend earned from this contribution until the maturity month
      const divOnContrib = contrib * yearRate6 * (partialEndMonth - m + 1) / 12
      dividendOnNew6 += divOnContrib

      const isLastMonth = m === partialEndMonth
      const runningBalance = year6Opening + yearContribs6
      const dividendAccrued = isLastMonth ? dividendOnCarried6 + dividendOnNew6 : 0
      const closingBalance = runningBalance + dividendAccrued
      const monthlyDividendEstimate = (year6Opening * yearRate6) / 12 + divOnContrib

      monthlyRows.push({
        year: 6,
        calendarYear: calYear6,
        calendarMonth: m,
        label: format(new Date(calYear6, m - 1, 1), 'MMM yyyy'),
        openingBalance: year6Opening,
        contribution: contrib,
        dividendOnContribution: divOnContrib,
        monthlyDividendEstimate,
        dividendAccrued,
        runningBalance,
        closingBalance,
      })
    }

    const totalYear6Dividend = dividendOnCarried6 + dividendOnNew6
    carriedBalance = year6Opening + yearContribs6 + totalYear6Dividend

    yearlyRows.push({
      year: 6,
      calendarYear: calYear6,
      openingBalance: year6Opening,
      contributions: yearContribs6,
      dividendOnCarriedBalance: dividendOnCarried6,
      dividendOnNewContributions: dividendOnNew6,
      dividends: totalYear6Dividend,
      closingBalance: carriedBalance,
    })
  }
  // ─────────────────────────────────────────────────────────────────────────

  const totalContributions = yearlyRows.reduce((s, r) => s + r.contributions, 0)
  const totalDividends = yearlyRows.reduce((s, r) => s + r.dividends, 0)
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
