import { jsPDF as JsPDF } from 'jspdf';

import type { Report } from '@/types/report.types';

export const exportReportToPDF = async (report: Report) => {
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
    // Silently ignore logo loading errors - PDF will still be generated without logo
    console.warn('Failed to add logo to PDF:', error);
  }

  // Add title
  pdfDoc.setFontSize(16);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Rapport de Réunion', margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  // Add report title
  const reportTitleY = margin + 35;
  pdfDoc.setFontSize(14);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(report.title, margin, reportTitleY);

  // Add meeting date
  const meetingDateY = reportTitleY + 10;
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  const meetingDate = new Date(report.meetingDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdfDoc.text(`Réunion du ${meetingDate}`, margin, meetingDateY);

  // Add content
  const contentY = meetingDateY + 15;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');

  // Split content into lines that fit the page width
  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;

  const contentLines = pdfDoc.splitTextToSize(report.content, maxWidth);

  let currentY = contentY;
  const lineHeight = 6;
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  contentLines.forEach((line: string) => {
    // Check if we need a new page
    if (currentY + lineHeight > pageHeight - bottomMargin) {
      pdfDoc.addPage();
      currentY = margin;
    }

    pdfDoc.text(line, margin, currentY);
    currentY += lineHeight;
  });

  // Save PDF with report title as filename
  const safeTitle = report.title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const filename = `Rapport_${safeTitle}_${new Date(report.meetingDate).toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};
