import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { LouadoShift } from './types';

declare module 'jspdf' {
  interface JsPDF {
    autoTable: typeof autoTable;
  }
}

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
};

const computeTitle = (shifts: LouadoShift[]) => {
  if (!shifts.length) {
    return 'Calendrier Louado';
  }

  const sortedDates = [...shifts]
    .map((shift) => new Date(shift.date))
    .sort((a, b) => a.getTime() - b.getTime());

  const first = sortedDates[0];
  const last = sortedDates[sortedDates.length - 1];
  if (!first || !last) {
    return 'Calendrier Louado';
  }

  const firstLabel = first.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  const lastLabel = last.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  if (firstLabel === lastLabel) {
    return `Calendrier Louado ${firstLabel}`;
  }

  return `Calendrier Louado ${firstLabel} - ${lastLabel}`;
};

export const exportLouadoScheduleToPDF = async (
  shifts: LouadoShift[],
  options?: { title?: string },
) => {
  const pdfDoc = new JsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  const margin = 15;

  // Try to embed the Louado logo if available
  try {
    const response = await fetch('/assets/images/Wlogo.png');
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      pdfDoc.addImage(base64, 'PNG', margin, margin, 30, 18);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Impossible de charger le logo Louado pour le PDF:', error);
  }

  const titleText = options?.title || computeTitle(shifts);

  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setFontSize(20);
  pdfDoc.setTextColor(30, 60, 30);
  pdfDoc.text(titleText.toUpperCase(), margin + 40, margin + 12);

  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setTextColor(80, 80, 80);
  pdfDoc.text(
    `Exporté le ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    margin + 40,
    margin + 20,
  );

  const tableBody = shifts.map((shift) => [
    formatDateLabel(shift.date),
    shift.louange
      ? `${shift.louange.firstName?.toUpperCase() || ''} ${
          shift.louange.lastName?.toUpperCase() || ''
        }`.trim()
      : '—',
    shift.adoration
      ? `${shift.adoration.firstName?.toUpperCase() || ''} ${
          shift.adoration.lastName?.toUpperCase() || ''
        }`.trim()
      : '—',
    shift.notes || '',
  ]);

  autoTable(pdfDoc, {
    startY: margin + 28,
    head: [['DATE', 'LOUANGE', 'ADORATION', 'OBS']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [92, 130, 180],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 12,
    },
    bodyStyles: {
      fillColor: [226, 239, 218],
      textColor: [34, 68, 34],
      fontSize: 11,
    },
    alternateRowStyles: {
      fillColor: [237, 242, 229],
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', fontSize: 11 },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'left' },
    },
    styles: {
      font: 'helvetica',
      lineColor: [100, 120, 100],
      lineWidth: 0.3,
    },
    margin: { left: margin, right: margin },
    tableWidth: 'auto',
  });

  pdfDoc.save(
    `${titleText.replace(/\s+/g, '_').toLowerCase()}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
};
