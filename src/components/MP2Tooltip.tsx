'use client'

import { useState } from 'react'

interface TooltipProps {
  content: string
  children?: React.ReactNode
}

export function InfoTooltip({ content }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="ml-1 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center hover:bg-blue-200 transition-colors cursor-help"
        aria-label="More information"
      >
        ?
      </button>
      {open && (
        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 pointer-events-none">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

export function MP2InfoBox() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        How does MP2 work?
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1.5">
          <p>
            <strong>Pag-IBIG MP2</strong> (Modified Pag-IBIG 2) is a voluntary savings program with a
            5-year maturity period and higher dividends than the regular Pag-IBIG program.
          </p>
          <p>
            <strong>Dividends</strong> are declared annually by the Pag-IBIG Fund Board based on
            fund performance. Historical rates have ranged from 5% to 7.5%.
          </p>
          <p>
            <strong>Tax-free:</strong> MP2 dividends are exempt from withholding tax, making it one
            of the best savings instruments available to Filipinos.
          </p>
          <p className="text-blue-600 font-medium">
            Note: This calculator uses an estimated dividend rate. Actual dividends depend on
            Pag-IBIG Fund's annual performance.
          </p>
        </div>
      )}
    </div>
  )
}
