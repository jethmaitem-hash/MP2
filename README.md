# 🏦 Pag-IBIG MP2 Savings Calculator

A free, fast, and mobile-friendly calculator for the Pag-IBIG Modified Pag-IBIG II (MP2) voluntary savings program. No login required — everything runs in your browser.

## ✨ Features

- **Multi-scenario** — Create up to 5 savings plans and compare them side by side
- **Instant calculations** — Real-time MP2 projection as you type
- **Year-by-year breakdown** — Detailed table showing contributions, dividends, and balance per year
- **Growth chart** — Visual area chart of your savings trajectory
- **Comparison view** — Overlay all scenarios in one chart, highlights the best result
- **PDF export** — Download a formatted report for any scenario
- **LocalStorage persistence** — Your scenarios are saved in the browser across sessions
- **Mobile-first** — Clean responsive design built with Tailwind CSS

## 🧮 Calculation Model

Dividends are estimated using mid-year average contribution timing:

```
Dividends = OpeningBalance × Rate + AnnualContributions × 0.5 × Rate
```

First-year contributions are prorated based on your selected start date.

> **Disclaimer:** This is an estimate only. Actual MP2 dividends are declared annually by the Pag-IBIG Fund Board and depend on fund performance.

## 🛠 Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Date handling | date-fns |
| PDF export | jsPDF + jspdf-autotable |
| State | React useReducer + LocalStorage |

## 🚀 Run Locally

```bash
# Clone
git clone https://github.com/jethmaitem-hash/cashflow.git
cd cashflow

# Install
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repository directly in the [Vercel dashboard](https://vercel.com/new) — it will auto-detect Next.js.

## 📁 Project Structure

```
src/
  app/
    layout.tsx        # Root layout + metadata
    page.tsx          # Entry page
    globals.css       # Tailwind directives
  components/
    MP2Calculator.tsx # Root client component, owns state
    Navigation.tsx    # Sticky header with tab switcher
    ScenarioTabs.tsx  # Scenario pill tabs + add button
    ScenarioForm.tsx  # Input form for each scenario
    SummaryCards.tsx  # Metric cards (Invested / Dividends / Maturity)
    YearlyBreakdown.tsx # Year-by-year data table
    GrowthChart.tsx   # Recharts area chart
    ComparisonView.tsx # Multi-scenario overlay + comparison table
    PDFExportButton.tsx # PDF download trigger
    MP2Tooltip.tsx    # Info tooltips and MP2 explainer
  lib/
    calculations.ts   # Pure MP2 calculation logic
  store/
    scenarioStore.ts  # useReducer + LocalStorage hook
  types/
    index.ts          # TypeScript interfaces
  utils/
    formatters.ts     # PHP currency / percent formatters
    pdf.ts            # PDF generation with jsPDF
```
