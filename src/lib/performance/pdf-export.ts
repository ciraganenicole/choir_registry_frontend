import { jsPDF as JsPDF } from 'jspdf';

import type { Performance } from './types';

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
    console.warn('Failed to add logo to PDF:', error);
  }

  // Add title
  pdfDoc.setFontSize(16);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Rapport de Performance', margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  let currentY = margin + 35;

  // Performance Information Section
  pdfDoc.setFontSize(14);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Informations de la Performance', margin, currentY);
  currentY += 10;

  // Performance details
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');

  const performanceDate = new Date(performance.date).toLocaleDateString(
    'fr-FR',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );

  const performanceDetails = [
    { label: 'Type:', value: performance.type },
    { label: 'Date:', value: performanceDate },
    { label: 'Emplacement:', value: performance.location || 'Non spécifié' },
    {
      label: 'Public attendu:',
      value: performance.expectedAudience?.toString() || 'Non spécifié',
    },
    {
      label: 'Chef de service:',
      value: performance.shiftLead
        ? `${performance.shiftLead.firstName} ${performance.shiftLead.lastName}`
        : 'Non assigné',
    },
    { label: 'Statut:', value: performance.status },
  ];

  performanceDetails.forEach((detail) => {
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text(detail.label, margin, currentY);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(detail.value, margin + 40, currentY);
    currentY += 6;
  });

  // Add notes if available
  if (performance.notes) {
    currentY += 3;
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text('Notes:', margin, currentY);
    currentY += 6;
    pdfDoc.setFont('helvetica', 'normal');

    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    const notesLines = pdfDoc.splitTextToSize(performance.notes, maxWidth);

    notesLines.forEach((line: string) => {
      pdfDoc.text(line, margin, currentY);
      currentY += 5;
    });
  }

  currentY += 10;

  // Songs Section
  if (performance.performanceSongs && performance.performanceSongs.length > 0) {
    pdfDoc.setFontSize(14);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text(
      `Chansons Interprétées (${performance.performanceSongs.length})`,
      margin,
      currentY,
    );
    currentY += 10;

    performance.performanceSongs.forEach((performanceSong, index) => {
      // Check if we need a new page
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const bottomMargin = 20;

      if (currentY > pageHeight - bottomMargin - 50) {
        pdfDoc.addPage();
        currentY = margin;
      }

      // Song header
      pdfDoc.setFontSize(12);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text(
        `${index + 1}. ${performanceSong.song.title}`,
        margin,
        currentY,
      );
      currentY += 6;

      // Song composer
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(
        `Compositeur: ${performanceSong.song.composer}`,
        margin,
        currentY,
      );
      currentY += 5;

      // Song genre
      pdfDoc.text(`Genre: ${performanceSong.song.genre}`, margin, currentY);
      currentY += 5;

      // Musical key
      if (performanceSong.musicalKey) {
        pdfDoc.text(
          `Tonalité: ${performanceSong.musicalKey}`,
          margin,
          currentY,
        );
        currentY += 5;
      }

      // Order and time allocated
      pdfDoc.text(`Ordre: ${performanceSong.order}`, margin, currentY);
      currentY += 5;

      if (performanceSong.timeAllocated) {
        pdfDoc.text(
          `Durée allouée: ${performanceSong.timeAllocated} minutes`,
          margin,
          currentY,
        );
        currentY += 5;
      }

      // Lead singer
      if (performanceSong.leadSinger) {
        pdfDoc.text(
          `Chef de chant: ${performanceSong.leadSinger.firstName} ${performanceSong.leadSinger.lastName}`,
          margin,
          currentY,
        );
        currentY += 5;
      }

      currentY += 3;

      // Attaque-chant (Voice Parts)
      if (performanceSong.voiceParts && performanceSong.voiceParts.length > 0) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text('Attaque-chant (Parties vocales):', margin, currentY);
        currentY += 5;

        performanceSong.voiceParts.forEach((voicePart) => {
          pdfDoc.setFont('helvetica', 'normal');
          pdfDoc.text(`• ${voicePart.type}:`, margin + 5, currentY);
          currentY += 4;

          if (voicePart.members && voicePart.members.length > 0) {
            const memberNames = voicePart.members
              .map((member) => `${member.firstName} ${member.lastName}`)
              .join(', ');
            pdfDoc.text(`  Membres: ${memberNames}`, margin + 10, currentY);
            currentY += 4;
          }

          if (voicePart.focusPoints) {
            pdfDoc.text(
              `  Points de focus: ${voicePart.focusPoints}`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          if (voicePart.notes) {
            pdfDoc.text(`  Notes: ${voicePart.notes}`, margin + 10, currentY);
            currentY += 4;
          }

          if (voicePart.timeAllocated) {
            pdfDoc.text(
              `  Temps alloué: ${voicePart.timeAllocated} min`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          currentY += 2;
        });
      }

      // Defense (Musicians)
      if (performanceSong.musicians && performanceSong.musicians.length > 0) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text('Defense (Musiciens):', margin, currentY);
        currentY += 5;

        performanceSong.musicians.forEach((musician) => {
          pdfDoc.setFont('helvetica', 'normal');
          const musicianName = musician.user
            ? `${musician.user.firstName} ${musician.user.lastName}`
            : musician.musicianName || 'Nom non spécifié';

          pdfDoc.text(
            `• ${musicianName} (${musician.instrument})`,
            margin + 5,
            currentY,
          );
          currentY += 4;

          if (musician.role) {
            pdfDoc.text(`  Rôle: ${musician.role}`, margin + 10, currentY);
            currentY += 4;
          }

          if (musician.isSoloist) {
            pdfDoc.text(`  Soliste: Oui`, margin + 10, currentY);
            currentY += 4;
          }

          if (musician.isAccompanist) {
            pdfDoc.text(`  Accompagnateur: Oui`, margin + 10, currentY);
            currentY += 4;
          }

          if (musician.soloStartTime && musician.soloEndTime) {
            pdfDoc.text(
              `  Solo: ${musician.soloStartTime}s - ${musician.soloEndTime}s`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          if (musician.soloNotes) {
            pdfDoc.text(
              `  Notes solo: ${musician.soloNotes}`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          if (musician.accompanimentNotes) {
            pdfDoc.text(
              `  Notes accompagnement: ${musician.accompanimentNotes}`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          if (musician.timeAllocated) {
            pdfDoc.text(
              `  Temps alloué: ${musician.timeAllocated} min`,
              margin + 10,
              currentY,
            );
            currentY += 4;
          }

          if (musician.notes) {
            pdfDoc.text(`  Notes: ${musician.notes}`, margin + 10, currentY);
            currentY += 4;
          }

          currentY += 2;
        });
      }

      // Focus points and notes
      if (performanceSong.focusPoints || performanceSong.notes) {
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text('Points de focus et notes:', margin, currentY);
        currentY += 5;

        pdfDoc.setFont('helvetica', 'normal');
        if (performanceSong.focusPoints) {
          pdfDoc.text(
            `Focus: ${performanceSong.focusPoints}`,
            margin + 5,
            currentY,
          );
          currentY += 4;
        }

        if (performanceSong.notes) {
          pdfDoc.text(`Notes: ${performanceSong.notes}`, margin + 5, currentY);
          currentY += 4;
        }
      }

      currentY += 8;

      // Add separator line between songs
      if (
        performance.performanceSongs &&
        index < performance.performanceSongs.length - 1
      ) {
        pdfDoc.line(
          margin,
          currentY,
          pdfDoc.internal.pageSize.getWidth() - margin,
          currentY,
        );
        currentY += 5;
      }
    });
  } else {
    // No songs message
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.text(
      'Aucune chanson assignée à cette performance',
      margin,
      currentY,
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
