import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { DailyContributionSummary } from './types';

export const exportToPDF = async (
  data: (DailyContributionSummary & {
    dailyContributions?: {
      date: string;
      amountFC: number;
      amountUSD: number;
    }[];
  })[],
) => {
  const pdfDoc = new JsPDF({
    orientation: 'portrait',
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

  // Calculate grand totals
  const grandTotalFC = data.reduce(
    (sum, item) => sum + (item.totalAmountFC || 0),
    0,
  );
  const grandTotalUSD = data.reduce(
    (sum, item) => sum + (item.totalAmountUSD || 0),
    0,
  );

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
    // Map each date to the contribution for that date (FC)
    const dateCells = allDates.map((date) => {
      const contrib = item.dailyContributions?.find(
        (c: any) => c.date === date,
      );
      return contrib ? contrib.amountFC : 0;
    });
    // Total cell: FC up, USD down
    const totalCell = `${item.totalAmountFC > 0 ? `${item.totalAmountFC.toLocaleString()} FC` : '0 FC'}\n${item.totalAmountUSD > 0 ? `$${item.totalAmountUSD.toFixed(2)}` : '0 $'}`;
    return [`${item.lastName} ${item.firstName}`, ...dateCells, totalCell];
  });

  // Add totals row
  const totalsRow = [
    'Total général',
    ...allDates.map(() => ''),
    `${grandTotalFC > 0 ? `${grandTotalFC.toLocaleString()} FC` : '0 FC'}\n${grandTotalUSD > 0 ? `$${grandTotalUSD.toFixed(2)}` : '0 $'}`,
  ];
  body.push(totalsRow);

  autoTable(pdfDoc, {
    head: [headers],
    body,
    startY: margin + 25,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [43, 53, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 12,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 12,
      halign: 'left',
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didParseCell: (hookData) => {
      const { cell, column, row } = hookData;
      const isTotalsRow =
        Array.isArray(row.raw) && row.raw[0] === 'Total général';
      if (isTotalsRow) {
        cell.styles.fillColor = [230, 230, 230];
        if (column.index === 0) {
          cell.styles.fontStyle = 'bold';
        }
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
        cell.styles.halign = 'left';
      }

      if (row.index > 0 && column.index > 2) {
        cell.styles.fontSize = 12;
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
            cellData.doc.setFontSize(12);
            cellData.doc.setTextColor(0, 0, 0);
            cellData.doc.text(number, textX, textY, { baseline: 'top' });
            const numberWidth = cellData.doc.getTextWidth(number);
            cellData.doc.setFont('helvetica', 'normal');
            cellData.doc.setFontSize(12);
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

  // Save PDF
  pdfDoc.save(
    `Daily_Contributions_${new Date().toISOString().split('T')[0]}.pdf`,
  );
};
