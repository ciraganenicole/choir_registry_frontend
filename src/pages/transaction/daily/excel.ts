import ExcelJS from 'exceljs';

import type { DailyContributionSummary } from '../types';

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
      new Date(item.lastContribution).toLocaleDateString(),
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
