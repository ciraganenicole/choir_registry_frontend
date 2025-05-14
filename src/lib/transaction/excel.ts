import ExcelJS from 'exceljs';
import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { DailyContributionSummary } from './types';

export const exportToExcel = async (data: DailyContributionSummary[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daily Contributions');

  // Add logo
  const logoId = workbook.addImage({
    base64: '/path/to/your/logo.png',
    extension: 'png',
  });
  worksheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 100, height: 50 },
  });

  // Add title and date range
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Daily Contributions Report';
  titleCell.font = {
    name: 'Arial',
    size: 16,
    bold: true,
    color: { argb: '000000' },
  };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  // Add headers with styling
  const headers = [
    'First Name',
    'Last Name',
    'Total USD',
    'Total FC',
    'Last Contribution',
    'Frequency',
    'Status',
  ];

  worksheet.addRow([]);
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(headers);

  // Style header row
  headerRow.eachCell((cell) => {
    // eslint-disable-next-line no-param-reassign
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2B3544' }, // Dark blue background
    };
    // eslint-disable-next-line no-param-reassign
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFF' }, // White text
      name: 'Arial',
      size: 12,
    };
    // eslint-disable-next-line no-param-reassign
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
  });

  // Add data with alternating row colors
  data.forEach((item, index) => {
    const row = worksheet.addRow([
      item.firstName,
      item.lastName,
      item.totalAmountUSD,
      item.totalAmountFC,
      item.frequency,
      item.frequency >= 20 ? 'Regular' : 'Irregular',
    ]);

    // Alternate row colors
    row.eachCell((cell) => {
      // eslint-disable-next-line no-param-reassign
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'F3F4F6' : 'FFFFFF' },
      };
      // eslint-disable-next-line no-param-reassign
      cell.alignment = { horizontal: 'center' };

      // Add currency formatting
      if (Number(cell.col) === 3 || Number(cell.col) === 4) {
        // eslint-disable-next-line no-param-reassign
        cell.numFmt = '"$"#,##0.00';
      }
    });
  });

  // Add totals row
  const totalRow = worksheet.addRow([
    'Total',
    '',
    `=SUM(C5:C${data.length + 4})`,
    `=SUM(D5:D${data.length + 4})`,
    '',
    `=AVERAGE(F5:F${data.length + 4})`,
    '',
  ]);

  totalRow.eachCell((cell) => {
    // eslint-disable-next-line no-param-reassign
    cell.font = { bold: true };
    // eslint-disable-next-line no-param-reassign
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E5E7EB' },
    };
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    // eslint-disable-next-line no-param-reassign
    column.width = 15;
  });

  // Add borders
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      // eslint-disable-next-line no-param-reassign
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Daily_Contributions_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportToPDF = async (data: DailyContributionSummary[]) => {
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
  pdfDoc.text('Daily Contributions Report', margin + 40, margin + 10);

  // Add date
  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    margin + 40,
    margin + 18,
  );

  // Gather all unique dates from data
  const allDatesSet = new Set<string>();
  data.forEach((item) => {
    item.contributionDates.forEach((date) => allDatesSet.add(date));
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
    // Map each date to the contribution for that date (FC and USD)
    const dateCells = allDates.map((date) => {
      // For this export, we don't have per-date currency breakdown, so just show a check if contributed
      const contributed = item.contributionDates.includes(date);
      return contributed ? '✔' : '0';
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
      halign: 'center',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    didParseCell: (hookData) => {
      const { cell, column, row } = hookData;

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
        cell.styles.halign = 'center';
      }

      if (row.index === 0) {
        cell.styles.fontSize = 10;
        cell.styles.fontStyle = 'bold';
      }

      if (row.index > 0 && column.index > 2) {
        cell.styles.fontSize = 9;
      }
    },
  });

  // Save PDF
  pdfDoc.save(
    `Daily_Contributions_${new Date().toISOString().split('T')[0]}.pdf`,
  );
};
