import { ScenarioInput, ScenarioResult } from '@/types'
import { formatPercent } from './formatters'
import { format } from 'date-fns'

// jsPDF's built-in Helvetica font does not include the ₱ character.
// Use "PHP" prefix for all currency values in the PDF to avoid garbled text.
function pdfMoney(amount: number): string {
  return 'PHP ' + new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getLastTableY(doc: unknown): number {
  return (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
}

export async function exportScenarioPDF(
  scenario: ScenarioInput,
  result: ScenarioResult
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.width
  const margin = 14
  const now = format(new Date(), 'yyyy-MM-dd')

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Pag-IBIG MP2 Savings Calculator', margin, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now}   |   jwmdigitalsolutions@gmail.com`, margin, 22)

  // ── Scenario title ────────────────────────────────────────────────────────
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(scenario.name, margin, 42)

  // ── Scenario inputs summary ───────────────────────────────────────────────
  let contribDesc = ''
  if (scenario.contributionMode === 'fixed') {
    const freq = scenario.fixedFrequency === 'monthly' ? 'Monthly' : 'Yearly'
    contribDesc = `${freq} — ${pdfMoney(scenario.fixedAmount)}`
  } else {
    const total = scenario.contributions.reduce((s, c) => s + c.amount, 0)
    contribDesc = `Flexible — ${scenario.contributions.length} entries, ${pdfMoney(total)} total`
  }

  const rateLabel = scenario.dividendRates && scenario.dividendRates.length > 0
    ? scenario.dividendRates.map((r, i) => `Yr${i + 1}: ${formatPercent(r)}`).join('  ')
    : formatPercent(scenario.dividendRate)

  const inputLines: [string, string][] = [
    ['Contribution:', contribDesc],
    ['Investment Period:', '5 Years / 60 Months (MP2)'],
    ['Dividend Rate:', rateLabel],
    ['Start Date:', scenario.startDate],
  ]

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(9)
  let y = 50
  for (const [label, value] of inputLines) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 60, y)
    y += 6
  }

  // ── Summary Dashboard Cards ───────────────────────────────────────────────
  y += 4
  const cardW = (pageW - margin * 2 - 8) / 3
  const cards = [
    { label: 'Total Invested',   value: pdfMoney(result.totalContributions), color: [30, 58, 138] as [number,number,number] },
    { label: 'Total Dividends',  value: pdfMoney(result.totalDividends),     color: [5, 150, 105]  as [number,number,number] },
    { label: 'Maturity Value',   value: pdfMoney(result.maturityValue),      color: [245, 158, 11] as [number,number,number] },
  ]

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4)
    doc.setFillColor(245, 247, 255)
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F')
    doc.setDrawColor(...card.color)
    doc.setLineWidth(0.8)
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'S')

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 4, y + 7)

    doc.setTextColor(...card.color)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 4, y + 17)
  })

  y += 30

  // ── Year-by-Year Breakdown ────────────────────────────────────────────────
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Year-by-Year Breakdown', margin, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Year', 'Opening Balance', 'Contributions', 'Div on Carried', 'Div on New', 'Total Div', 'Closing Balance']],
    body: result.yearlyBreakdown.map((row) => [
      row.year <= 5 ? `Year ${row.year}` : `Year ${row.year} (Partial)`,
      pdfMoney(row.openingBalance),
      pdfMoney(row.contributions),
      pdfMoney(row.dividendOnCarriedBalance),
      pdfMoney(row.dividendOnNewContributions),
      pdfMoney(row.dividends),
      pdfMoney(row.closingBalance),
    ]),
    foot: [[
      'Total', '—',
      pdfMoney(result.yearlyBreakdown.reduce((s, r) => s + r.contributions, 0)),
      pdfMoney(result.yearlyBreakdown.reduce((s, r) => s + r.dividendOnCarriedBalance, 0)),
      pdfMoney(result.yearlyBreakdown.reduce((s, r) => s + r.dividendOnNewContributions, 0)),
      pdfMoney(result.totalDividends),
      pdfMoney(result.maturityValue),
    ]],
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    footStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── Monthly Breakdown ─────────────────────────────────────────────────────
  const afterYearly = getLastTableY(doc)
  doc.addPage()

  doc.setTextColor(30, 58, 138)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Monthly Breakdown', margin, 16)

  autoTable(doc, {
    startY: 20,
    head: [['Month', 'Contribution', 'Opening Balance', 'Est. Monthly Div.', 'Credited Dividend', 'Closing Balance']],
    body: result.monthlyBreakdown.map((row) => [
      row.label,
      row.contribution > 0 ? pdfMoney(row.contribution) : '—',
      pdfMoney(row.openingBalance),
      pdfMoney(row.monthlyDividendEstimate),
      row.dividendAccrued > 0 ? pdfMoney(row.dividendAccrued) : '—',
      pdfMoney(row.closingBalance),
    ]),
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: {
      0: { halign: 'left', cellWidth: 24 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    // Highlight year-end rows (dividend credited)
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = result.monthlyBreakdown[data.row.index]
        if (row && row.dividendAccrued > 0) {
          data.cell.styles.fillColor = [220, 252, 231]
          data.cell.styles.textColor = [5, 100, 60]
        }
      }
    },
  })

  // ── Flexible contributions schedule ──────────────────────────────────────
  if (scenario.contributionMode === 'flexible' && scenario.contributions.length > 0) {
    const afterMonthly = getLastTableY(doc)
    const flexY = afterMonthly + 10

    // Add new page if not enough room
    const startY = flexY > 220 ? (doc.addPage(), 16) : flexY

    doc.setTextColor(30, 58, 138)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Flexible Contribution Schedule', margin, startY)

    const sorted = [...scenario.contributions].sort((a, b) => a.date.localeCompare(b.date))

    autoTable(doc, {
      startY: startY + 4,
      head: [['Month', 'Planned Amount']],
      body: sorted.map((c) => [c.date, pdfMoney(c.amount)]),
      headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      styles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' } },
    })
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.height

    doc.setFillColor(30, 58, 138)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'This is an estimate only. Actual MP2 dividends depend on Pag-IBIG Fund performance.',
      margin, pageH - 5
    )
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 5, { align: 'right' })
  }

  // Suppress unused variable warning
  void afterYearly

  doc.save(`mp2-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${now}.pdf`)
}
