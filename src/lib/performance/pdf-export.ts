import { jsPDF as JsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { Performance } from './types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface JsPDF {
    autoTable: typeof autoTable;
  }
}

export const exportPerformanceToPDF = async (performance: Performance) => {
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
  pdfDoc.text('Rapport de Performance', margin + 40, margin + 12);

  // Add subtitle with performance type
  pdfDoc.setFontSize(14);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.setTextColor(100, 100, 100); // Medium gray
  pdfDoc.text(performance.type, margin + 40, margin + 20);

  // Add date with better formatting
  pdfDoc.setFontSize(11);
  pdfDoc.setTextColor(60, 60, 60);
  pdfDoc.text(
    `Généré le: ${new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    margin + 40,
    margin + 26,
  );

  let currentY = margin + 45;

  // Performance Information Table
  const performanceDate = new Date(performance.date).toLocaleDateString(
    'fr-FR',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  const performanceData = [
    ['Type de Performance', performance.type],
    ['Date', performanceDate],
    ['Emplacement', performance.location || 'Non spécifié'],
    [
      'Public Attendu',
      performance.expectedAudience?.toString() || 'Non spécifié',
    ],
    [
      'Chef de Service',
      performance.shiftLead
        ? `${performance.shiftLead.firstName} ${performance.shiftLead.lastName}`
        : 'Non assigné',
    ],
    ['Statut', performance.status],
  ];

  autoTable(pdfDoc, {
    startY: currentY,
    head: [['Informations de la Performance', '']],
    body: performanceData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
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
        fillColor: [236, 240, 241], // Light blue-gray
      },
      1: {
        halign: 'left',
      },
    },
    margin: { left: margin, right: margin },
    tableWidth: 'wrap',
  });

  currentY = (pdfDoc as any).lastAutoTable.finalY + 15;

  // Add notes section if available
  if (performance.notes) {
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text('Notes Générales', margin, currentY);
    currentY += 8;

    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setTextColor(60, 60, 60);

    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    const notesLines = pdfDoc.splitTextToSize(performance.notes, maxWidth);

    notesLines.forEach((line: string) => {
      pdfDoc.text(line, margin, currentY);
      currentY += 5;
    });
    currentY += 10;
  }

  // Songs Section with beautiful table
  if (performance.performanceSongs && performance.performanceSongs.length > 0) {
    pdfDoc.setFontSize(16);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setTextColor(40, 40, 40);
    pdfDoc.text(
      `Répertoire Musical (${performance.performanceSongs.length} chanson${performance.performanceSongs.length > 1 ? 's' : ''})`,
      margin,
      currentY,
    );
    currentY += 15;

    // Create songs summary table
    const songsSummaryData = performance.performanceSongs.map((song, index) => [
      index + 1,
      song.song.title,
      song.song.composer,
      song.song.genre,
      song.musicalKey || 'N/A',
      song.order,
      song.timeAllocated ? `${song.timeAllocated} min` : 'N/A',
    ]);

    autoTable(pdfDoc, {
      startY: currentY,
      head: [
        ['#', 'Titre', 'Compositeur', 'Genre', 'Tonalité', 'Ordre', 'Durée'],
      ],
      body: songsSummaryData,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 152, 219], // Blue header
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center' }, // #
        1: { halign: 'left' }, // Title
        2: { halign: 'left' }, // Composer
        3: { halign: 'left' }, // Genre
        4: { halign: 'center' }, // Key
        5: { halign: 'center' }, // Order
        6: { halign: 'center' }, // Duration
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
    });

    currentY = (pdfDoc as any).lastAutoTable.finalY + 20;

    // Detailed song information
    performance.performanceSongs.forEach((performanceSong, index) => {
      // Check if we need a new page
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const bottomMargin = 20;

      if (currentY > pageHeight - bottomMargin - 80) {
        pdfDoc.addPage();
        currentY = margin;
      }

      // Song header with background color
      pdfDoc.setFillColor(52, 152, 219); // Blue background
      pdfDoc.rect(
        margin,
        currentY - 3,
        pdfDoc.internal.pageSize.getWidth() - margin * 2,
        8,
        'F',
      );

      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.setTextColor(255, 255, 255); // White text
      pdfDoc.text(
        `${index + 1}. ${performanceSong.song.title}`,
        margin + 2,
        currentY + 2,
      );
      currentY += 12;

      // Song details in a table
      const songDetails = [
        ['Compositeur', performanceSong.song.composer],
        ['Genre', performanceSong.song.genre],
        ['Tonalité', performanceSong.musicalKey || 'Non spécifiée'],
        ["Ordre d'exécution", performanceSong.order.toString()],
        [
          'Durée allouée',
          performanceSong.timeAllocated
            ? `${performanceSong.timeAllocated} minutes`
            : 'Non spécifiée',
        ],
        [
          'Chef de chant',
          performanceSong.leadSinger
            ? `${performanceSong.leadSinger.firstName} ${performanceSong.leadSinger.lastName}`
            : 'Non assigné',
        ],
      ];

      autoTable(pdfDoc, {
        startY: currentY,
        body: songDetails,
        theme: 'plain',
        bodyStyles: {
          fontSize: 9,
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

      currentY = (pdfDoc as any).lastAutoTable.finalY + 10;

      // Voice Parts Table
      if (performanceSong.voiceParts && performanceSong.voiceParts.length > 0) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(40, 40, 40);
        pdfDoc.text('Parties Vocales', margin, currentY);
        currentY += 8;

        const voicePartsData = performanceSong.voiceParts.map((voicePart) => [
          voicePart.type,
          voicePart.members?.length || 0,
          voicePart.members
            ?.map((m) => `${m.firstName} ${m.lastName}`)
            .join(', ') || 'Aucun membre',
          voicePart.focusPoints || 'N/A',
          voicePart.timeAllocated ? `${voicePart.timeAllocated} min` : 'N/A',
        ]);

        autoTable(pdfDoc, {
          startY: currentY,
          head: [['Partie', 'Membres', 'Noms', 'Points de Focus', 'Temps']],
          body: voicePartsData,
          theme: 'grid',
          headStyles: {
            fillColor: [46, 204, 113], // Green header
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7,
          },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'left' },
            3: { halign: 'left' },
            4: { halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: 'wrap',
        });

        currentY = (pdfDoc as any).lastAutoTable.finalY + 10;
      }

      // Musicians Table
      if (performanceSong.musicians && performanceSong.musicians.length > 0) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(40, 40, 40);
        pdfDoc.text('Musiciens', margin, currentY);
        currentY += 8;

        const musiciansData = performanceSong.musicians.map((musician) => [
          musician.user
            ? `${musician.user.firstName} ${musician.user.lastName}`
            : musician.musicianName || 'Nom non spécifié',
          musician.instrument,
          musician.role || 'N/A',
          musician.isSoloist ? 'Oui' : 'Non',
          musician.isAccompanist ? 'Oui' : 'Non',
          musician.timeAllocated ? `${musician.timeAllocated} min` : 'N/A',
        ]);

        autoTable(pdfDoc, {
          startY: currentY,
          head: [
            ['Nom', 'Instrument', 'Rôle', 'Soliste', 'Accompagnateur', 'Temps'],
          ],
          body: musiciansData,
          theme: 'grid',
          headStyles: {
            fillColor: [155, 89, 182], // Purple header
            textColor: 255,
            fontSize: 8,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7,
          },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'left' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
          },
          margin: { left: margin, right: margin },
          tableWidth: 'wrap',
        });

        currentY = (pdfDoc as any).lastAutoTable.finalY + 10;
      }

      // Focus points and notes
      if (performanceSong.focusPoints || performanceSong.notes) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(40, 40, 40);
        pdfDoc.text('Notes et Points de Focus', margin, currentY);
        currentY += 8;

        pdfDoc.setFontSize(9);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.setTextColor(60, 60, 60);

        if (performanceSong.focusPoints) {
          pdfDoc.text(
            `Focus: ${performanceSong.focusPoints}`,
            margin,
            currentY,
          );
          currentY += 5;
        }

        if (performanceSong.notes) {
          pdfDoc.text(`Notes: ${performanceSong.notes}`, margin, currentY);
          currentY += 5;
        }
      }

      currentY += 15;

      // Add separator line between songs
      if (
        performance.performanceSongs &&
        index < performance.performanceSongs.length - 1
      ) {
        pdfDoc.setDrawColor(200, 200, 200);
        pdfDoc.line(
          margin,
          currentY,
          pdfDoc.internal.pageSize.getWidth() - margin,
          currentY,
        );
        currentY += 10;
      }
    });
  } else {
    // No songs message with styling
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
      'Aucune chanson assignée à cette performance',
      margin + 2,
      currentY + 2,
    );
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
      'Nouvelle Jérusalem Choir - Rapport de Performance',
      margin,
      pdfDoc.internal.pageSize.getHeight() - 10,
    );
  }

  // Save PDF with performance details as filename
  const safeType = performance.type
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const performanceDateStr = new Date(performance.date)
    .toISOString()
    .split('T')[0];
  const filename = `Performance_${safeType}_${performanceDateStr}.pdf`;
  pdfDoc.save(filename);
};
