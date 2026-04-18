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

export async function exportScenarioPDF(
  scenario: ScenarioInput,
  result: ScenarioResult
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF()
  const now = format(new Date(), 'yyyy-MM-dd')

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Pag-IBIG MP2 Savings Calculator', 14, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${now}`, 14, 22)

  // ── Scenario title ────────────────────────────────────────────────────────
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(scenario.name, 14, 40)

  // ── Scenario inputs summary ───────────────────────────────────────────────
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  let contribDesc = ''
  if (scenario.contributionMode === 'fixed') {
    const freq = scenario.fixedFrequency === 'monthly' ? 'Monthly' : 'Yearly'
    contribDesc = `${freq} — ${pdfMoney(scenario.fixedAmount)}`
  } else {
    const total = scenario.contributions.reduce((s, c) => s + c.amount, 0)
    contribDesc = `Flexible — ${scenario.contributions.length} entries, ${pdfMoney(total)} total`
  }

  const inputLines: [string, string][] = [
    ['Contribution:', contribDesc],
    ['Investment Period:', '5 Years (MP2)'],
    ['Dividend Rate:', formatPercent(scenario.dividendRate)],
    ['Start Date:', scenario.startDate],
  ]

  let y = 50
  for (const [label, value] of inputLines) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, y)
    y += 7
  }

  // ── Summary totals ────────────────────────────────────────────────────────
  y += 5
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y - 5, 182, 32, 3, 3, 'F')
  doc.setFontSize(10)

  const summaryItems = [
    ['Total Invested', pdfMoney(result.totalContributions)],
    ['Total Dividends', pdfMoney(result.totalDividends)],
    ['Maturity Value', pdfMoney(result.maturityValue)],
  ]

  for (let i = 0; i < summaryItems.length; i++) {
    const col = 14 + i * 62
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(summaryItems[i][0], col, y + 5)
    doc.setTextColor(30, 58, 138)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(summaryItems[i][1], col, y + 16)
  }

  y += 42

  // ── Yearly breakdown table ────────────────────────────────────────────────
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Year-by-Year Breakdown', 14, y)

  autoTable(doc, {
    startY: y + 4,
    head: [['Year', 'Opening Balance', 'Contributions', 'Dividends', 'Closing Balance']],
    body: result.yearlyBreakdown.map((row) => [
      `Year ${row.year}`,
      pdfMoney(row.openingBalance),
      pdfMoney(row.contributions),
      pdfMoney(row.dividends),
      pdfMoney(row.closingBalance),
    ]),
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9 },
  })

  // ── Flexible contributions table (if applicable) ──────────────────────────
  if (scenario.contributionMode === 'flexible' && scenario.contributions.length > 0) {
    const afterYearly = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    const newY = afterYearly + 10

    if (newY < 250) {
      doc.setTextColor(30, 58, 138)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Flexible Contribution Schedule', 14, newY)

      const sorted = [...scenario.contributions].sort((a, b) => a.date.localeCompare(b.date))

      autoTable(doc, {
        startY: newY + 4,
        head: [['Month', 'Amount']],
        body: sorted.map((c) => [c.date, pdfMoney(c.amount)]),
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        styles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right' } },
      })
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'This is an estimate only. Actual MP2 dividends depend on Pag-IBIG Fund performance.',
      14,
      doc.internal.pageSize.height - 8
    )
  }

  doc.save(`mp2-${scenario.name.replace(/\s+/g, '-').toLowerCase()}-${now}.pdf`)
}
