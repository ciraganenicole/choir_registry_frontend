import { jsPDF as JsPDF } from 'jspdf';

import type { LeadershipShift } from '@/lib/shift/logic';
import { ShiftStatus } from '@/lib/shift/logic';

export const exportShiftListToPDF = async (shifts: LeadershipShift[]) => {
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
  pdfDoc.text('Liste des Horaires', margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  // Add total count and date range
  let currentY = margin + 35;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`Total: ${shifts.length} horaires`, margin, currentY);
  currentY += 5;

  // Calculate and display date range
  if (shifts.length > 0) {
    const dates = shifts
      .map((shift) => [new Date(shift.startDate), new Date(shift.endDate)])
      .flat()
      .sort((a, b) => a.getTime() - b.getTime());

    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];

    if (earliestDate && latestDate) {
      pdfDoc.text(
        `Période: ${earliestDate.toLocaleDateString('fr-FR')} - ${latestDate.toLocaleDateString('fr-FR')}`,
        margin,
        currentY,
      );
      currentY += 10;
    }
  } else {
    currentY += 5;
  }

  // Table headers
  const tableStartY = currentY;
  const colWidths = [35, 30, 40, 20]; // Name, Leader, Date Range, Status
  const colPositions = [
    margin,
    margin + colWidths[0]!,
    margin + colWidths[0]! + colWidths[1]!,
    margin + colWidths[0]! + colWidths[1]! + colWidths[2]!,
  ];

  // Header row
  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Nom', colPositions[0]!, tableStartY);
  pdfDoc.text('Conducteur', colPositions[1]!, tableStartY);
  pdfDoc.text('Période', colPositions[2]!, tableStartY);
  pdfDoc.text('Statut', colPositions[3]!, tableStartY);

  // Draw header underline
  pdfDoc.line(
    margin,
    tableStartY + 3,
    margin + colWidths[0]! + colWidths[1]! + colWidths[2]! + colWidths[3]!,
    tableStartY + 3,
  );

  // Table rows
  currentY = tableStartY + 8;
  const rowHeight = 6;
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  shifts.forEach((shift) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      pdfDoc.addPage();
      currentY = margin;

      // Redraw headers on new page
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Nom', colPositions[0]!, currentY);
      pdfDoc.text('Conducteur', colPositions[1]!, currentY);
      pdfDoc.text('Période', colPositions[2]!, currentY);
      pdfDoc.text('Statut', colPositions[3]!, currentY);
      pdfDoc.line(
        margin,
        currentY + 3,
        margin + colWidths[0]! + colWidths[1]! + colWidths[2]! + colWidths[3]!,
        currentY + 3,
      );
      currentY += 8;
    }

    // Shift data
    pdfDoc.setFontSize(9);
    pdfDoc.setFont('helvetica', 'normal');

    // Name (truncate if too long)
    const name =
      shift.name.length > 18 ? `${shift.name.substring(0, 15)}...` : shift.name;
    pdfDoc.text(name, colPositions[0]!, currentY);

    // Leader
    const leaderName = shift.leader
      ? `${shift.leader.firstName} ${shift.leader.lastName}`.length > 12
        ? `${`${shift.leader.firstName} ${shift.leader.lastName}`.substring(0, 9)}...`
        : `${shift.leader.firstName} ${shift.leader.lastName}`
      : 'N/A';
    pdfDoc.text(leaderName, colPositions[1]!, currentY);

    // Date Range
    const dateRange = (() => {
      if (!shift.startDate || !shift.endDate) return 'N/A';
      const start = new Date(shift.startDate).toLocaleDateString('fr-FR');
      const end = new Date(shift.endDate).toLocaleDateString('fr-FR');
      return `${start} - ${end}`;
    })();
    pdfDoc.text(dateRange, colPositions[2]!, currentY);

    // Status
    const getStatusText = (status: string) => {
      switch (status) {
        case 'Active':
          return 'Actif';
        case 'Upcoming':
          return 'À venir';
        case 'Completed':
          return 'Terminé';
        case 'Cancelled':
          return 'Annulé';
        default:
          return status;
      }
    };

    // Determine actual status based on dates
    const now = new Date();
    const startDate = new Date(shift.startDate);
    const endDate = new Date(shift.endDate);

    let actualStatus = shift.status;
    if (shift.status !== ShiftStatus.CANCELLED) {
      if (now < startDate) {
        actualStatus = ShiftStatus.UPCOMING;
      } else if (now >= startDate && now <= endDate) {
        actualStatus = ShiftStatus.ACTIVE;
      } else {
        actualStatus = ShiftStatus.COMPLETED;
      }
    }

    pdfDoc.text(getStatusText(actualStatus), colPositions[3]!, currentY);

    currentY += rowHeight;
  });

  // Save PDF with descriptive filename
  const filename = `Liste_Horaires_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};

export const exportShiftDetailToPDF = async (shift: LeadershipShift) => {
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
  pdfDoc.text("Détails de l'Horaire", margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  // Add shift name
  const shiftTitleY = margin + 35;
  pdfDoc.setFontSize(14);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(shift.name || 'Horaire sans nom', margin, shiftTitleY);

  // Add status
  const statusY = shiftTitleY + 10;
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');

  // Determine actual status based on dates
  const now = new Date();
  const startDate = new Date(shift.startDate);
  const endDate = new Date(shift.endDate);

  let actualStatus = shift.status;
  if (shift.status !== ShiftStatus.CANCELLED) {
    if (now < startDate) {
      actualStatus = ShiftStatus.UPCOMING;
    } else if (now >= startDate && now <= endDate) {
      actualStatus = ShiftStatus.ACTIVE;
    } else {
      actualStatus = ShiftStatus.COMPLETED;
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active':
        return 'Actif';
      case 'Upcoming':
        return 'À venir';
      case 'Completed':
        return 'Terminé';
      case 'Cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  pdfDoc.text(`Statut: ${getStatusText(actualStatus)}`, margin, statusY);

  // Add leader information
  const leaderY = statusY + 8;
  pdfDoc.text('Conducteur:', margin, leaderY);
  pdfDoc.text(
    `Nom: ${shift.leader ? `${shift.leader.firstName} ${shift.leader.lastName}` : 'Inconnu'}`,
    margin + 5,
    leaderY + 5,
  );
  pdfDoc.text(`Email: ${shift.leader?.email || '-'}`, margin + 5, leaderY + 10);
  pdfDoc.text(
    `Téléphone: ${shift.leader?.phoneNumber || '-'}`,
    margin + 5,
    leaderY + 15,
  );

  // Add schedule information
  const scheduleY = leaderY + 25;
  pdfDoc.text("Détails de l'horaire:", margin, scheduleY);
  pdfDoc.text(
    `Date de début: ${shift.startDate ? new Date(shift.startDate).toLocaleDateString('fr-FR') : '-'}`,
    margin + 5,
    scheduleY + 5,
  );
  pdfDoc.text(
    `Date de fin: ${shift.endDate ? new Date(shift.endDate).toLocaleDateString('fr-FR') : '-'}`,
    margin + 5,
    scheduleY + 10,
  );

  // Calculate duration
  if (shift.startDate && shift.endDate) {
    const start = new Date(shift.startDate);
    const end = new Date(shift.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    pdfDoc.text(`Durée: ${diffDays} jours`, margin + 5, scheduleY + 15);
  }

  // Add performance information
  const performanceY = scheduleY + 25;
  pdfDoc.text('Performances:', margin, performanceY);
  pdfDoc.text(
    `Programmées: ${shift.eventsScheduled || 0}`,
    margin + 5,
    performanceY + 5,
  );
  pdfDoc.text(
    `Terminées: ${shift.eventsCompleted || 0}`,
    margin + 5,
    performanceY + 10,
  );

  // Add notes section
  let currentY = performanceY + 20;
  if (shift.notes) {
    pdfDoc.setFontSize(11);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Notes:', margin, currentY);
    currentY += 8;

    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');

    // Split notes into lines that fit the page width
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    const notesLines = pdfDoc.splitTextToSize(shift.notes, maxWidth);

    const lineHeight = 5;
    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const bottomMargin = 20;

    notesLines.forEach((line: string) => {
      // Check if we need a new page
      if (currentY + lineHeight > pageHeight - bottomMargin) {
        pdfDoc.addPage();
        currentY = margin;
      }

      pdfDoc.text(line, margin, currentY);
      currentY += lineHeight;
    });
  }

  // Add creation info
  if (shift.created_by) {
    currentY += 10;
    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(
      `Créé par: ${shift.created_by.firstName} ${shift.created_by.lastName}`,
      margin,
      currentY,
    );

    if (shift.createdAt) {
      const createdDate = new Date(shift.createdAt).toLocaleDateString(
        'fr-FR',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );
      pdfDoc.text(`Créé le: ${createdDate}`, margin, currentY + 5);
    }
  }

  // Save PDF with shift name as filename
  const safeName = (shift.name || 'Horaire')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const filename = `Horaire_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};
