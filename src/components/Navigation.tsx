'use client'

import Image from 'next/image'
import { ActiveTab } from '@/types'

interface NavigationProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <header className="bg-brand-blue shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

          {/* Logo + Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <Image
                src="/pagibig-logo.svg"
                alt="Pag-IBIG Fund"
                width={48}
                height={48}
                className="rounded-full object-contain"
                onError={(e) => {
                  // Fallback to gold badge if image not found
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              {/* Fallback icon shown if image fails */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-gold items-center justify-center flex-shrink-0 hidden absolute inset-0" aria-hidden>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-sm sm:text-base leading-tight tracking-tight">
                MP2 Savings Calculator
              </h1>
              <p className="text-blue-200 text-[10px] sm:text-xs leading-tight">
                Pag-IBIG Fund &nbsp;·&nbsp; Free Tool
              </p>
            </div>
          </div>

          {/* Tab switcher — large, clearly clickable */}
          <nav className="flex gap-2" aria-label="Main navigation">
            <TabButton
              active={activeTab === 'calculator'}
              onClick={() => onTabChange('calculator')}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              label="Calculator"
            />
            <TabButton
              active={activeTab === 'compare'}
              onClick={() => onTabChange('compare')}
              icon={
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              label="Compare"
            />
          </nav>
        </div>
      </div>

    </header>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all border-2 ${
        active
          ? 'bg-white text-brand-blue border-white shadow-lg scale-105'
          : 'text-white border-white/30 hover:border-white/60 hover:bg-white/10'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
