import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { Performance } from '@/lib/performance/types';
import type { LeadershipShift } from '@/lib/shift/logic';
import { ShiftStatus } from '@/lib/shift/logic';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface JsPDF {
    autoTable: typeof autoTable;
  }
}

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
    // eslint-disable-next-line no-console
    console.warn('Failed to add logo to PDF:', error);
  }

  // Add title
  pdfDoc.setFontSize(16);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Programme de Conduite', margin + 36, margin + 10);

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
  const pageWidth = pdfDoc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - margin * 2;
  const colWidths = [tableWidth * 0.35, tableWidth * 0.45, tableWidth * 0.2]; // Leader, Date Range, Status
  const colPositions = [
    margin,
    margin + colWidths[0]!,
    margin + colWidths[0]! + colWidths[1]!,
  ];

  // Header row background
  const headerHeight = 8;
  pdfDoc.setFillColor(240, 240, 240);
  pdfDoc.rect(margin, tableStartY - 5, tableWidth, headerHeight, 'F');

  // Draw header borders
  pdfDoc.setDrawColor(0, 0, 0);
  pdfDoc.setLineWidth(0.3);

  // Outer border
  pdfDoc.rect(margin, tableStartY - 5, tableWidth, headerHeight);

  // Column separators
  pdfDoc.line(
    colPositions[1]!,
    tableStartY - 5,
    colPositions[1]!,
    tableStartY + 3,
  );
  pdfDoc.line(
    colPositions[2]!,
    tableStartY - 5,
    colPositions[2]!,
    tableStartY + 3,
  );

  // Header text
  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Conducteur', colPositions[0]! + 2, tableStartY);
  pdfDoc.text('Période', colPositions[1]! + 2, tableStartY);
  pdfDoc.text('Statut', colPositions[2]! + 2, tableStartY);

  // Table rows
  currentY = tableStartY + 8;
  const rowHeight = 8;
  const pageHeight = pdfDoc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  shifts.forEach((shift, index) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      pdfDoc.addPage();
      currentY = margin;

      // Redraw headers on new page
      pdfDoc.setFillColor(240, 240, 240);
      pdfDoc.rect(margin, currentY - 5, tableWidth, headerHeight, 'F');

      pdfDoc.setDrawColor(0, 0, 0);
      pdfDoc.setLineWidth(0.3);
      pdfDoc.rect(margin, currentY - 5, tableWidth, headerHeight);
      pdfDoc.line(
        colPositions[1]!,
        currentY - 5,
        colPositions[1]!,
        currentY + 3,
      );
      pdfDoc.line(
        colPositions[2]!,
        currentY - 5,
        colPositions[2]!,
        currentY + 3,
      );

      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Conducteur', colPositions[0]! + 2, currentY);
      pdfDoc.text('Période', colPositions[1]! + 2, currentY);
      pdfDoc.text('Statut', colPositions[2]! + 2, currentY);
      currentY += 8;
    }

    // Draw row borders
    pdfDoc.setDrawColor(200, 200, 200);
    pdfDoc.setLineWidth(0.2);

    // Outer border
    pdfDoc.rect(margin, currentY - 4, tableWidth, rowHeight);

    // Column separators
    pdfDoc.line(colPositions[1]!, currentY - 4, colPositions[1]!, currentY + 4);
    pdfDoc.line(colPositions[2]!, currentY - 4, colPositions[2]!, currentY + 4);

    // Alternate row background
    if (index % 2 === 1) {
      pdfDoc.setFillColor(250, 250, 250);
      pdfDoc.rect(margin, currentY - 4, tableWidth, rowHeight, 'F');
      // Redraw borders after fill
      pdfDoc.setDrawColor(200, 200, 200);
      pdfDoc.rect(margin, currentY - 4, tableWidth, rowHeight);
      pdfDoc.line(
        colPositions[1]!,
        currentY - 4,
        colPositions[1]!,
        currentY + 4,
      );
      pdfDoc.line(
        colPositions[2]!,
        currentY - 4,
        colPositions[2]!,
        currentY + 4,
      );
    }

    // Shift data
    pdfDoc.setFontSize(9);
    pdfDoc.setFont('helvetica', 'normal');

    // Leader
    const leaderName = shift.leader
      ? `${shift.leader.lastName} ${shift.leader.firstName}`.length > 20
        ? `${` ${shift.leader.lastName} ${shift.leader.firstName}`.substring(0, 17)}...`
        : ` ${shift.leader.lastName} ${shift.leader.firstName}`
      : 'N/A';
    pdfDoc.text(leaderName, colPositions[0]! + 2, currentY);

    // Date Range
    const dateRange = (() => {
      if (!shift.startDate || !shift.endDate) return 'N/A';
      const start = new Date(shift.startDate).toLocaleDateString('fr-FR');
      const end = new Date(shift.endDate).toLocaleDateString('fr-FR');
      return `${start} - ${end}`;
    })();
    pdfDoc.text(dateRange, colPositions[1]! + 2, currentY);

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

    pdfDoc.text(getStatusText(actualStatus), colPositions[2]! + 2, currentY);

    currentY += rowHeight;
  });

  // Save PDF with descriptive filename
  const filename = `Liste_Horaires_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};

export const exportShiftDetailToPDF = async (
  shift: LeadershipShift,
  performances?: Performance[],
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
    // Silently ignore logo loading errors - PDF will still be generated without logo
    // eslint-disable-next-line no-console
    console.warn('Failed to add logo to PDF:', error);
  }

  // Add title with better styling
  pdfDoc.setFontSize(20);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(40, 40, 40); // Dark gray
  pdfDoc.text("Détails de l'Horaire", margin + 40, margin + 12);

  let currentY = margin + 45;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return [46, 204, 113]; // Green
      case 'Upcoming':
        return [52, 152, 219]; // Blue
      case 'Completed':
        return [241, 196, 15]; // Yellow/Orange
      case 'Cancelled':
        return [231, 76, 60]; // Red
      default:
        return [149, 165, 166]; // Gray
    }
  };

  const translatePerformanceType = (type: string): string => {
    const translations: Record<string, string> = {
      Concert: 'Concert',
      'Worship Service': 'Service de Culte',
      'Sunday Service': 'Service du Dimanche',
      'Special Event': 'Événement Spécial',
      Rehearsal: 'Répétition',
      Wedding: 'Mariage',
      Funeral: 'Funérailles',
      Other: 'Autre',
    };
    return translations[type] || type;
  };

  // Status badge with colored background
  const statusColor = getStatusColor(actualStatus);
  pdfDoc.setFillColor(statusColor[0]!, statusColor[1]!, statusColor[2]!);
  pdfDoc.rect(margin, currentY - 3, 40, 8, 'F');
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(255, 255, 255); // White text
  pdfDoc.text(
    `Statut: ${getStatusText(actualStatus)}`,
    margin + 2,
    currentY + 2,
  );
  pdfDoc.setTextColor(40, 40, 40); // Reset to dark gray
  currentY += 15;

  // Shift Information Table
  const shiftInfoData = [
    ['Statut', getStatusText(actualStatus)],
    [
      'Période',
      `${new Date(shift.startDate).toLocaleDateString('fr-FR')} - ${new Date(shift.endDate).toLocaleDateString('fr-FR')}`,
    ],
    [
      'Durée',
      (() => {
        if (shift.startDate && shift.endDate) {
          const start = new Date(shift.startDate);
          const end = new Date(shift.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return `${diffDays} jours`;
        }
        return 'Non spécifiée';
      })(),
    ],
  ];

  autoTable(pdfDoc, {
    startY: currentY,
    head: [["Informations de l'Horaire", '']],
    body: shiftInfoData,
    theme: 'grid',
    headStyles: {
      fillColor: [155, 89, 182], // Purple header to match shift theme
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray for alternate rows
    },
    columnStyles: {
      0: {
        halign: 'left',
        fontStyle: 'bold',
        fillColor: [236, 240, 241], // Light background
      },
      1: {
        halign: 'left',
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: 'wrap',
  });

  currentY = (pdfDoc as any).lastAutoTable.finalY + 15;

  // Leader Information Table
  const leaderData = [
    [
      'Nom',
      shift.leader
        ? `${shift.leader.firstName} ${shift.leader.lastName}`
        : 'Inconnu',
    ],
    ['Email', shift.leader?.email || '-'],
    ['Téléphone', shift.leader?.phoneNumber || '-'],
  ];

  autoTable(pdfDoc, {
    startY: currentY,
    head: [['Conducteur', '']],
    body: leaderData,
    theme: 'grid',
    headStyles: {
      fillColor: [52, 152, 219], // Blue header
      textColor: 255,
      fontSize: 12,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray for alternate rows
    },
    columnStyles: {
      0: {
        halign: 'left',
        fontStyle: 'bold',
        fillColor: [236, 240, 241], // Light background
      },
      1: {
        halign: 'left',
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: 'wrap',
  });

  currentY = (pdfDoc as any).lastAutoTable.finalY + 15;

  // Add performance information with table
  pdfDoc.setFontSize(16);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.setTextColor(40, 40, 40);
  pdfDoc.text(
    `Répertoire des Performances (${performances?.length || shift.eventsScheduled || 0})`,
    margin,
    currentY,
  );

  currentY += 15;

  // Performance table
  if (performances && performances.length > 0) {
    const performanceData = performances.map((perf) => [
      translatePerformanceType(perf.type),
      perf.location || 'Non spécifié',
      new Date(perf.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ]);

    autoTable(pdfDoc, {
      startY: currentY,
      head: [['Type de Performance', 'Emplacement', 'Date']],
      body: performanceData,
      theme: 'striped',
      headStyles: {
        fillColor: [155, 89, 182], // Purple header to match shift theme
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: 'left' }, // Type - auto width
        1: { halign: 'left' }, // Location - auto width
        2: { halign: 'left' }, // Date - auto width
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
    });

    currentY = (pdfDoc as any).lastAutoTable.finalY + 15;
  } else {
    // No performances message with styling
    pdfDoc.setFillColor(255, 193, 7); // Yellow background
    pdfDoc.rect(
      margin,
      currentY - 3,
      pdfDoc.internal.pageSize.getWidth() - margin * 2,
      8,
      'F',
    );

    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text(
      `Programmées: ${shift.eventsScheduled || 0} | Terminées: ${shift.eventsCompleted || 0}`,
      margin + 2,
      currentY + 2,
    );
    pdfDoc.setTextColor(40, 40, 40); // Reset
    currentY += 15;
  }

  // Add notes section with better styling
  if (shift.notes) {
    currentY += 5;
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text('Notes Générales', margin, currentY);
    currentY += 8;

    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(60, 60, 60);

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
    currentY += 10;
  }

  // Add creation info in a table
  if (shift.created_by) {
    const creationData = [
      [
        'Créé par',
        `${shift.created_by.firstName} ${shift.created_by.lastName}`,
      ],
      [
        'Date de création',
        shift.createdAt
          ? new Date(shift.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '-',
      ],
    ];

    autoTable(pdfDoc, {
      startY: currentY,
      head: [['Informations de Création', '']],
      body: creationData,
      theme: 'plain',
      headStyles: {
        fillColor: [149, 165, 166], // Gray header
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: {
          halign: 'left',
          fontStyle: 'bold',
          fillColor: [250, 250, 250], // Very light background
        },
        1: {
          halign: 'left',
        },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
    });

    currentY = (pdfDoc as any).lastAutoTable.finalY + 15;
  }

  // Footer
  const pageCount = pdfDoc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    pdfDoc.setPage(i);
    pdfDoc.setFontSize(8);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(150, 150, 150);
    pdfDoc.text(
      `Page ${i} sur ${pageCount}`,
      pdfDoc.internal.pageSize.getWidth() - 30,
      pdfDoc.internal.pageSize.getHeight() - 10,
    );
    pdfDoc.text(
      "Nouvelle Jérusalem Choir - Détails de l'Horaire",
      margin,
      pdfDoc.internal.pageSize.getHeight() - 10,
    );
  }

  // Save PDF with shift name as filename
  const safeName = (shift.name || 'Horaire')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const filename = `Horaire_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};
