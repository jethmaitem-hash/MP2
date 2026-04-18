import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MP2 Savings Calculator — Free Pag-IBIG Tool',
  description:
    'Free Pag-IBIG MP2 Savings Calculator. Estimate your MP2 maturity value, total dividends, and year-by-year growth. No login required.',
  keywords: ['MP2', 'Pag-IBIG', 'savings', 'calculator', 'Philippines', 'dividends'],
  authors: [{ name: 'MP2 Calculator' }],
  openGraph: {
    title: 'MP2 Savings Calculator — Free Pag-IBIG Tool',
    description: 'Estimate your Pag-IBIG MP2 returns. Free, instant, no login.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a8a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
