export type ContributionMode = 'fixed' | 'flexible'
export type FixedFrequency = 'monthly' | 'yearly'
export type ActiveTab = 'calculator' | 'compare'

export interface FlexibleContribution {
  id: string
  date: string   // 'YYYY-MM' format
  amount: number
}

export interface ScenarioInput {
  id: string
  name: string
  investmentPeriod: 5           // always 5 years (MP2 standard)
  dividendRate: number          // decimal, e.g. 0.06 for 6%
  startDate: string             // ISO date string YYYY-MM-DD

  // Contribution settings
  contributionMode: ContributionMode

  // Fixed mode
  fixedFrequency: FixedFrequency
  fixedAmount: number

  // Flexible mode — planned contributions
  contributions: FlexibleContribution[]

  // Actual contribution tracking (optional, for target vs actual)
  actualContributions: FlexibleContribution[]
}

export interface MonthlyRow {
  year: number              // relative year 1–5
  calendarYear: number
  calendarMonth: number     // 1-indexed (Jan=1, Dec=12)
  label: string             // e.g. 'Jan 2025'

  openingBalance: number    // balance carried from prior year-end (constant within a year)
  contribution: number      // new money deposited this month

  // Exact dividend this contribution earns for the rest of the year:
  //   contribution × rate × (13 − calendarMonth) / 12
  dividendOnContribution: number

  // Legacy / display: monthly accrual estimate on full balance
  monthlyDividendEstimate: number

  // Year-end only: total dividends credited (carried dividend + all monthly dividends)
  dividendAccrued: number

  runningBalance: number    // openingBalance + cumulative contributions so far this year
  closingBalance: number    // = runningBalance (mid-year) or runningBalance + dividendAccrued (Dec)
}

export interface YearlyRow {
  year: number              // relative year 1–5
  calendarYear: number
  openingBalance: number    // balance at start of this calendar year
  contributions: number     // total new contributions this year
  dividendOnCarriedBalance: number   // openingBalance × rate
  dividendOnNewContributions: number // Σ C_m × rate × (13−m)/12
  dividends: number                  // = dividendOnCarriedBalance + dividendOnNewContributions
  closingBalance: number
}

export interface ScenarioResult {
  totalContributions: number
  totalDividends: number
  maturityValue: number
  yearlyBreakdown: YearlyRow[]
  monthlyBreakdown: MonthlyRow[]
  highestContributionMonth: { label: string; amount: number } | null
  totalContributionMonths: number
}

export interface StoreState {
  scenarios: ScenarioInput[]
  activeId: string
  activeTab: ActiveTab
}

export type StoreAction =
  | { type: 'ADD_SCENARIO' }
  | { type: 'UPDATE_SCENARIO'; payload: Partial<ScenarioInput> & { id: string } }
  | { type: 'DELETE_SCENARIO'; payload: { id: string } }
  | { type: 'DUPLICATE_SCENARIO'; payload: { id: string } }
  | { type: 'SET_ACTIVE'; payload: { id: string } }
  | { type: 'SET_TAB'; payload: { tab: ActiveTab } }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: StoreState }
