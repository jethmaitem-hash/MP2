'use client'

import { ScenarioInput } from '@/types'
import { StoreAction } from '@/types'

interface ScenarioTabsProps {
  scenarios: ScenarioInput[]
  activeId: string
  canAdd: boolean
  maxScenarios: number
  dispatch: React.Dispatch<StoreAction>
}

export function ScenarioTabs({
  scenarios,
  activeId,
  canAdd,
  maxScenarios,
  dispatch,
}: ScenarioTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-14 sm:top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE', payload: { id: scenario.id } })}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                scenario.id === activeId
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  scenario.id === activeId ? 'bg-brand-gold' : 'bg-gray-300'
                }`}
              />
              {scenario.name}
            </button>
          ))}

          {/* Add scenario button */}
          {canAdd ? (
            <button
              onClick={() => dispatch({ type: 'ADD_SCENARIO' })}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border border-dashed border-blue-300 hover:border-blue-400"
              title="Add scenario"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add</span>
            </button>
          ) : (
            <span className="flex-shrink-0 text-xs text-gray-400 px-2 py-1.5 whitespace-nowrap">
              Max {maxScenarios} scenarios
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
