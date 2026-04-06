'use client'

import { useReducer, useEffect, useState } from 'react'
import { StoreState, StoreAction, ScenarioInput, FlexibleContribution } from '@/types'

// Bump version when ScenarioInput shape changes to avoid loading stale data
const STORAGE_KEY = 'mp2_calculator_v2'
const MAX_SCENARIOS = 5

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function makeId(): string {
  return Math.random().toString(36).slice(2)
}

function makeFlexContrib(overrides: Partial<FlexibleContribution> = {}): FlexibleContribution {
  return {
    id: makeId(),
    date: new Date().toISOString().slice(0, 7), // YYYY-MM
    amount: 5000,
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioInput> = {}): ScenarioInput {
  return {
    id: makeId(),
    name: 'New Scenario',
    investmentPeriod: 5,
    dividendRate: 0.06,
    startDate: today(),
    contributionMode: 'fixed',
    fixedFrequency: 'monthly',
    fixedAmount: 5000,
    contributions: [],
    actualContributions: [],
    ...overrides,
  }
}

/** Build sample flexible contributions spread across the first 2 years */
function sampleFlexContribs(): FlexibleContribution[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed
  const entries: FlexibleContribution[] = []
  const amounts: Record<string, number> = {
    [`${year}-${String(month).padStart(2,'0')}`]: 10000,
    [`${year}-${String(Math.min(month+1,12)).padStart(2,'0')}`]: 15000,
    [`${year}-${String(Math.min(month+2,12)).padStart(2,'0')}`]: 10000,
    [`${year}-${String(Math.min(month+3,12)).padStart(2,'0')}`]: 20000,
    [`${year}-${String(Math.min(month+4,12)).padStart(2,'0')}`]: 10000,
    [`${year+1}-01`]: 50000,
    [`${year+1}-03`]: 30000,
    [`${year+1}-06`]: 25000,
    [`${year+1}-09`]: 40000,
    [`${year+1}-12`]: 20000,
  }
  for (const [date, amount] of Object.entries(amounts)) {
    entries.push(makeFlexContrib({ date, amount }))
  }
  return entries
}

const defaultScenarios: ScenarioInput[] = [
  makeScenario({
    id: 'default-1',
    name: 'MP2 Plan A',
    contributionMode: 'fixed',
    fixedFrequency: 'monthly',
    fixedAmount: 5000,
    dividendRate: 0.06,
  }),
  makeScenario({
    id: 'default-2',
    name: 'MP2 Plan B – Flexible',
    contributionMode: 'flexible',
    dividendRate: 0.0703,
    contributions: sampleFlexContribs(),
  }),
]

export const initialState: StoreState = {
  scenarios: defaultScenarios,
  activeId: defaultScenarios[0].id,
  activeTab: 'calculator',
}

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'ADD_SCENARIO': {
      if (state.scenarios.length >= MAX_SCENARIOS) return state
      const newScenario = makeScenario({ name: `Scenario ${state.scenarios.length + 1}` })
      return {
        ...state,
        scenarios: [...state.scenarios, newScenario],
        activeId: newScenario.id,
      }
    }

    case 'UPDATE_SCENARIO': {
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      }
    }

    case 'DELETE_SCENARIO': {
      if (state.scenarios.length <= 1) return state
      const remaining = state.scenarios.filter((s) => s.id !== action.payload.id)
      const newActiveId =
        state.activeId === action.payload.id ? remaining[0].id : state.activeId
      return { ...state, scenarios: remaining, activeId: newActiveId }
    }

    case 'DUPLICATE_SCENARIO': {
      if (state.scenarios.length >= MAX_SCENARIOS) return state
      const source = state.scenarios.find((s) => s.id === action.payload.id)
      if (!source) return state
      const duped = makeScenario({
        ...source,
        id: makeId(),
        name: `${source.name} (Copy)`,
        contributions: source.contributions.map((c) => ({ ...c, id: makeId() })),
        actualContributions: (source.actualContributions ?? []).map((c) => ({ ...c, id: makeId() })),
      })
      return {
        ...state,
        scenarios: [...state.scenarios, duped],
        activeId: duped.id,
      }
    }

    case 'SET_ACTIVE': {
      return { ...state, activeId: action.payload.id }
    }

    case 'SET_TAB': {
      return { ...state, activeTab: action.payload.tab }
    }

    case 'RESET': {
      return initialState
    }

    case 'HYDRATE': {
      return action.payload
    }

    default:
      return state
  }
}

export function useScenarioStore() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: StoreState = JSON.parse(raw)
        if (Array.isArray(parsed.scenarios) && parsed.scenarios.length > 0) {
          // Normalize scenarios loaded from older storage versions
          const normalized: StoreState = {
            ...parsed,
            scenarios: parsed.scenarios.map((s) => ({
              ...s,
              actualContributions: s.actualContributions ?? [],
              fixedFrequency: s.fixedFrequency ?? ('monthly' as const),
              // dividendRates is optional — leave undefined if not present (uses dividendRate fallback)
              dividendRates: s.dividendRates ?? undefined,
            })),
          }
          dispatch({ type: 'HYDRATE', payload: normalized })
        }
      }
    } catch {
      // Corrupt data — fall back to defaults
    }
    setHydrated(true)
  }, [])

  // Persist to localStorage after hydration
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or unavailable — ignore
    }
  }, [state, hydrated])

  const activeScenario =
    state.scenarios.find((s) => s.id === state.activeId) ?? state.scenarios[0]
  const canAdd = state.scenarios.length < MAX_SCENARIOS

  return {
    state,
    dispatch,
    hydrated,
    activeScenario,
    canAdd,
    maxScenarios: MAX_SCENARIOS,
  }
}
