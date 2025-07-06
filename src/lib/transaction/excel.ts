import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '@/config/api';

import type { DailyContributionSummary } from './types';

export const exportToPDF = async (
  data: (DailyContributionSummary & {
    dailyContributions?: {
      date: string;
      amountFC: number;
      amountUSD: number;
    }[];
  })[],
  conversionRate?: number,
) => {
  const pdfDoc = new JsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const margin = 15;

  // Add logo
  try {
    const response = await fetch('/assets/images/Wlogo.png');
    const blob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    pdfDoc.addImage(base64, 'PNG', margin, margin, 35, 20);
  } catch (error) {
    // Remove console.warn
  }

  // Add title
  pdfDoc.setFontSize(16);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(
    'Rapport de Contributions Quotidiennes',
    margin + 36,
    margin + 10,
  );

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    margin + 36,
    margin + 18,
  );

  // 1. Fetch total solde (all-time)
  let totalSoldeUSD = 0;
  let totalSoldeFC = 0;
  try {
    const { data: totalSoldeData } = await api.get('/transactions/stats');
    totalSoldeUSD = totalSoldeData.totals?.solde?.usd || 0;
    totalSoldeFC = totalSoldeData.totals?.solde?.fc || 0;
  } catch (err) {
    // If the fetch fails, leave totals at 0
  }

  // 2. Fetch solde for the current month
  const now = new Date();
  const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now;
  const startDateCurrent = firstDayCurrentMonth.toISOString().split('T')[0];
  const endDateCurrent = today.toISOString().split('T')[0];
  let currentMonthSoldeUSD = 0;
  let currentMonthSoldeFC = 0;
  try {
    const { data: currentMonthData } = await api.get('/transactions/stats', {
      params: { startDate: startDateCurrent, endDate: endDateCurrent }
    });
    currentMonthSoldeUSD = currentMonthData.totals?.solde?.usd || 0;
    currentMonthSoldeFC = currentMonthData.totals?.solde?.fc || 0;
  } catch (err) {
    // If the fetch fails, leave at 0
  }

  // 3. Calculate solde for all previous months
  const pastMonthSoldeUSD = totalSoldeUSD - currentMonthSoldeUSD;
  const pastMonthSoldeFC = totalSoldeFC - currentMonthSoldeFC;
  const pastMonthFCinUSD = conversionRate && conversionRate > 0 ? (pastMonthSoldeFC / conversionRate) : 0;
  const pastMonthDiff = (Math.abs(pastMonthFCinUSD) - Math.abs(pastMonthSoldeUSD)).toFixed(2);

  // Fetch total expenses (all time)
  let totalExpenseUSD = 0;
  let totalExpenseFC = 0;
  try {
    const { data: statsData } = await api.get('/transactions/stats');
    totalExpenseUSD = statsData.totals?.expense?.usd || 0;
    totalExpenseFC = statsData.totals?.expense?.fc || 0;
  } catch (err) {}

  // Helper to show FC equivalent in dollars
  const fcToUsd = (fc: number) =>
    conversionRate && conversionRate > 0 ? `(${(fc / conversionRate).toFixed(2)} $)` : '';

  // Add summary (resume) section under the logo, before the table
  let summaryY = margin + 15; // After logo and title/date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Résumé:', margin, summaryY);
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');
  const totalFCinUSD = conversionRate && conversionRate > 0 ? (totalSoldeFC / conversionRate) : 0;
  const totalSoldeDiff = (Math.abs(totalFCinUSD) - Math.abs(totalSoldeUSD)).toFixed(2);
  pdfDoc.text(
    `Solde cumulé: ${totalSoldeUSD} $ / ${totalSoldeFC} FC (${totalFCinUSD.toFixed(2)} $) = ${totalSoldeDiff}`,
    margin,
    summaryY + 8
  );
  pdfDoc.text(
    `Solde du Mois Précédent: ${pastMonthSoldeUSD} $ / ${pastMonthSoldeFC} FC (${pastMonthFCinUSD.toFixed(2)} $) = ${pastMonthDiff}`,
    margin,
    summaryY + 16
  );
  // Gather all unique dates from data
  const allDatesSet = new Set<string>();
  data.forEach((item) => {
    if (item.dailyContributions) {
      item.dailyContributions.forEach((c: any) => allDatesSet.add(c.date));
    } else if (item.contributionDates) {
      item.contributionDates.forEach((date: string) => allDatesSet.add(date));
    }
  });
  const allDates = Array.from(allDatesSet).sort();

  // Table headers
  const headers = [
    'Noms',
    ...allDates.map((date) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
    }),
    'Total',
  ];

  // Table body
  const body = data.map((item) => {
    // Map each date to the contribution for that date (FC and USD)
    const dateCells = allDates.map((date) => {
      const contribs =
        item.dailyContributions?.filter((c: any) => c.date === date) || [];
      const amountFC = contribs
        .filter((c: any) => c.amountFC)
        .reduce((sum: number, c: any) => sum + (c.amountFC || 0), 0);
      const amountUSD = contribs
        .filter((c: any) => c.amountUSD)
        .reduce((sum: number, c: any) => sum + (c.amountUSD || 0), 0);
      if (amountFC > 0 && amountUSD > 0) {
        return `${amountFC} FC, ${amountUSD.toFixed(0)} $`;
      }
      if (amountFC > 0) {
        return `${amountFC} FC`;
      }
      if (amountUSD > 0) {
        return `${amountUSD.toFixed(0)} $`;
      }
      return '0';
    });
    // Total cell: FC and USD logic
    const totalFC = item.totalAmountFC || 0;
    const totalUSD = item.totalAmountUSD || 0;
    let totalCell = '';
    if (totalFC > 0 && totalUSD > 0) {
      totalCell = `${totalFC} FC, ${totalUSD.toFixed(0)} $`;
    } else if (totalFC > 0) {
      totalCell = `${totalFC} FC`;
    } else if (totalUSD > 0) {
      totalCell = `${totalUSD.toFixed(0)} $`;
    } else {
      totalCell = '0';
    }
    return [`${item.lastName} ${item.firstName}`, ...dateCells, totalCell];
  });

  // Insert an empty row between the list of names and the Total général row
  const emptyRow = Array(headers.length).fill('');
  body.push(emptyRow);

  // Add totals row
  let totalsFC = 0;
  let totalsUSD = 0;
  const grandTotalCell = (() => {
    if (totalsFC > 0 && totalsUSD > 0) {
      return `${totalsFC} FC, ${totalsUSD.toFixed(0)} $`;
    }
    if (totalsFC > 0) {
      return `${totalsFC} FC`;
    }
    if (totalsUSD > 0) {
      return `${totalsUSD.toFixed(0)} $`;
    }
    return '0';
  })();
  const totalsRow = [
    'Total général',
    ...allDates.map((date) => {
      let sumFC = 0;
      let sumUSD = 0;
      data.forEach((item) => {
        const contribs =
          item.dailyContributions?.filter((c: any) => c.date === date) || [];
        sumFC += contribs
          .filter((c: any) => c.amountFC)
          .reduce((sum: number, c: any) => sum + (c.amountFC || 0), 0);
        sumUSD += contribs
          .filter((c: any) => c.amountUSD)
          .reduce((sum: number, c: any) => sum + (c.amountUSD || 0), 0);
      });
      totalsFC += sumFC;
      totalsUSD += sumUSD;
      if (sumFC > 0 && sumUSD > 0) {
        return `${sumFC} FC, ${sumUSD.toFixed(0)} $`;
      }
      if (sumFC > 0) {
        return `${sumFC} FC`;
      }
      if (sumUSD > 0) {
        return `${sumUSD.toFixed(0)} $`;
      }
      return '0';
    }),
    grandTotalCell,
  ];
  body.push(totalsRow);

  // Add subtotal and total rows
  const subtotalFCRow = [
    '',
    ...Array(allDates.length).fill(''),
    `Sous-total FC: ${totalsFC} FC`,
  ];
  const subtotalUSDRow = [
    '',
    ...Array(allDates.length).fill(''),
    `Sous-total $: ${totalsUSD.toFixed(0)} $`,
  ];
  const convertedFCtoUSD =
    conversionRate && conversionRate > 0 ? totalsFC / conversionRate : 0;
  const totalUSD = convertedFCtoUSD + totalsUSD;
  const totalUSDRow = [
    '',
    ...Array(allDates.length).fill(''),
    `Total $: ${totalUSD.toFixed(0)} $`,
  ];
  body.push(subtotalFCRow, subtotalUSDRow, totalUSDRow);

  // Store the result of autoTable to get finalY
  autoTable(pdfDoc, {
    head: [headers],
    body,
    startY: summaryY + 28,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [43, 53, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 8,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'right',
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didParseCell: (hookData) => {
      const { cell, column, row } = hookData;
      const isTotalsRow =
        Array.isArray(row.raw) && row.raw[0] === 'Total général';
      const lastCell = Array.isArray(row.raw)
        ? row.raw[row.raw.length - 1]
        : undefined;
      const isSummaryRow =
        typeof lastCell === 'string' &&
        (lastCell.startsWith('Sous-total FC:') ||
          lastCell.startsWith('Sous-total $:') ||
          lastCell.startsWith('Total $:'));
      if (isTotalsRow) {
        cell.styles.fillColor = [230, 230, 230];
        if (column.index === 0) {
          cell.styles.fontStyle = 'bold';
        }
      }
      if (isSummaryRow) {
        cell.styles.fillColor = [91, 227, 248];
        cell.styles.fontSize = 8;
        cell.styles.fontStyle = 'bold';
        if (Array.isArray(row.raw) && column.index === row.raw.length - 1) {
          cell.styles.textColor = [0, 0, 0];
        }
      }
      // Make the Total column (last column) semi-bold and larger
      if (Array.isArray(row.raw) && column.index === row.raw.length - 1) {
        cell.styles.fontStyle = 'bold'; // 'semibold' is not supported, use 'bold'
        cell.styles.fontSize = 8;
      }
      // Set all text except header to black
      if (hookData.section !== 'head') {
        cell.styles.textColor = [0, 0, 0];
      }
      // Set base styles
      cell.styles.lineWidth = 0.1;
      cell.styles.lineColor = [0, 0, 0];
      cell.styles.cellPadding = {
        top: 0.5,
        right: 0.5,
        bottom: 0.5,
        left: 0.5,
      };

      if (column.index > 2) {
        cell.styles.halign = 'right';
      }

      if (row.index > 0 && column.index > 2) {
        cell.styles.fontSize = 8;
      }
    },
    didDrawCell: (cellData) => {
      const isTotalsRow =
        Array.isArray(cellData.row.raw) &&
        cellData.row.raw[0] === 'Total général';
      const isTotalCell =
        cellData.column.index === cellData.table.columns.length - 1;
      if (isTotalsRow && isTotalCell) {
        const cellText = cellData.cell.text[0] || '';
        const lines = cellText.split('\n');
        const { x, y } = cellData.cell;
        let textY = y + 6;
        lines.forEach((line) => {
          const match = line.match(/^([\\d.,]+)\\s*(\\w+|\\$)$/);
          if (match) {
            const number = match[1];
            const currency = match[2];
            const textX = x + 2;
            cellData.doc.setFont('helvetica', 'bold');
            cellData.doc.setFontSize(8);
            cellData.doc.setTextColor(0, 0, 0);
            cellData.doc.text(number, textX, textY, { baseline: 'top' });
            const numberWidth = cellData.doc.getTextWidth(number);
            cellData.doc.setFont('helvetica', 'normal');
            cellData.doc.setFontSize(8);
            cellData.doc.setTextColor(0, 0, 0);
            cellData.doc.text(` ${currency}`, textX + numberWidth, textY, {
              baseline: 'top',
            });
          }
          textY += 7;
        });
        Object.assign(cellData.cell, { text: [''] });
      }
    },
  });

  // Get the Y position from pdfDoc.lastAutoTable.finalY
  const finalY = (pdfDoc as any).lastAutoTable?.finalY || (margin + 60);

  // Save PDF
  pdfDoc.save(
    `Daily_Contributions_${new Date().toISOString().split('T')[0]}.pdf`
  );
};
