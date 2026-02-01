import { jsPDF as JsPDF } from 'jspdf';

import type { Song } from '@/lib/library/logic';
import { fetchSongPerformanceCount } from '@/lib/library/logic';

export const exportSongToPDF = async (song: Song) => {
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
  pdfDoc.text('Fiche de Chant', margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  // Add song title
  const songTitleY = margin + 35;
  pdfDoc.setFontSize(14);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text(song.title, margin, songTitleY);

  // Add lyrics section
  const currentY = songTitleY + 15;
  if (song.lyrics) {
    pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');

    // Calculate page dimensions and column layout
    const pageWidth = pdfDoc.internal.pageSize.getWidth();
    const pageHeight = pdfDoc.internal.pageSize.getHeight();
    const bottomMargin = 20;
    const columnGap = 5; // Space between columns
    const columnWidth = (pageWidth - margin * 2 - columnGap) / 2;

    // Split lyrics into lines that fit the column width
    const lyricsLines = pdfDoc.splitTextToSize(song.lyrics, columnWidth);

    const lineHeight = 5;

    // Track column state
    let leftColumnY = currentY;
    let rightColumnY = currentY;
    let useLeftColumn = true;
    const leftColumnX = margin;
    const rightColumnX = margin + columnWidth + columnGap;

    lyricsLines.forEach((line: string) => {
      const currentColumnY = useLeftColumn ? leftColumnY : rightColumnY;

      // Check if current column needs a new page or column switch
      if (currentColumnY + lineHeight > pageHeight - bottomMargin) {
        if (useLeftColumn) {
          // Switch to right column
          useLeftColumn = false;
          rightColumnY = currentY; // Reset to start of content area
        } else {
          // Both columns full, need new page
          pdfDoc.addPage();
          leftColumnY = margin;
          rightColumnY = margin;
          useLeftColumn = true;
        }
      }

      // Determine which column to use after page/column check
      const finalColumnY = useLeftColumn ? leftColumnY : rightColumnY;
      const finalColumnX = useLeftColumn ? leftColumnX : rightColumnX;

      pdfDoc.text(line, finalColumnX, finalColumnY);

      // Update the appropriate column's Y position
      if (useLeftColumn) {
        leftColumnY += lineHeight;
      } else {
        rightColumnY += lineHeight;
      }
    });
  }

  // Save PDF with song title as filename
  const safeTitle = song.title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  const filename = `Chant_${safeTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};

export const exportSongListToPDF = async (songs: Song[]) => {
  // Fetch actual performance counts for all songs in parallel
  const performanceCountsMap = new Map<string, number>();
  try {
    const countPromises = songs.map(async (song) => {
      try {
        const countData = await fetchSongPerformanceCount(song.id);
        if (countData?.actualCount !== undefined) {
          performanceCountsMap.set(song.id, countData.actualCount);
        }
      } catch (error) {
        // Silently ignore errors for individual songs - fallback to song.performed
        console.warn(
          `Failed to fetch performance count for song ${song.id}:`,
          error,
        );
      }
    });
    await Promise.all(countPromises);
  } catch (error) {
    // Silently ignore errors - will use song.performed as fallback
    console.warn('Failed to fetch some performance counts:', error);
  }

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
  pdfDoc.text('Liste des Chants', margin + 36, margin + 10);

  // Add date
  pdfDoc.setFontSize(12);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(
    `Date: ${new Date().toLocaleDateString('fr-FR')}`,
    margin + 36,
    margin + 18,
  );

  // Add total count
  let currentY = margin + 35;
  pdfDoc.setFontSize(11);
  pdfDoc.setFont('helvetica', 'normal');
  pdfDoc.text(`Total: ${songs.length} chants`, margin, currentY);
  currentY += 10;

  // Table headers
  const tableStartY = currentY;
  const colWidths = [60, 35, 35, 25]; // Title, Genre, Added By, Fois Interprété
  const colPositions = [
    margin,
    margin + colWidths[0]!,
    margin + colWidths[0]! + colWidths[1]!,
    margin + colWidths[0]! + colWidths[1]! + colWidths[2]!,
  ];

  // Header row
  pdfDoc.setFontSize(10);
  pdfDoc.setFont('helvetica', 'bold');
  pdfDoc.text('Titre', colPositions[0]!, tableStartY);
  pdfDoc.text('Genre', colPositions[1]!, tableStartY);
  pdfDoc.text('Ajouté par', colPositions[2]!, tableStartY);
  pdfDoc.text('Fois interprété', colPositions[3]!, tableStartY);

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

  songs.forEach((song) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      pdfDoc.addPage();
      currentY = margin;

      // Redraw headers on new page
      pdfDoc.setFontSize(10);
      pdfDoc.setFont('helvetica', 'bold');
      pdfDoc.text('Titre', colPositions[0]!, currentY);
      pdfDoc.text('Genre', colPositions[1]!, currentY);
      pdfDoc.text('Ajouté par', colPositions[2]!, currentY);
      pdfDoc.text('Fois interprété', colPositions[3]!, currentY);
      pdfDoc.line(
        margin,
        currentY + 3,
        margin + colWidths[0]! + colWidths[1]! + colWidths[2]! + colWidths[3]!,
        currentY + 3,
      );
      currentY += 8;
    }

    // Song data
    pdfDoc.setFontSize(9);
    pdfDoc.setFont('helvetica', 'normal');

    // Title (truncate if too long)
    const title =
      song.title.length > 25 ? `${song.title.substring(0, 22)}...` : song.title;
    pdfDoc.text(title, colPositions[0]!, currentY);

    // Genre
    pdfDoc.text(song.genre, colPositions[1]!, currentY);

    // Added by
    const addedByText = (() => {
      if (
        typeof song.added_by === 'object' &&
        song.added_by.firstName &&
        song.added_by.lastName
      ) {
        return `${song.added_by.lastName} ${song.added_by.firstName}`;
      }
      if (typeof song.added_by === 'string') {
        return song.added_by;
      }
      return 'N/A';
    })();
    const addedBy =
      addedByText.length > 16
        ? `${addedByText.substring(0, 16)}...`
        : addedByText;
    pdfDoc.text(addedBy, colPositions[2]!, currentY);

    // Fois interprété - use actual count if available, otherwise fallback to song.performed
    const performedCount =
      performanceCountsMap.get(song.id) ?? song.performed ?? 0;
    pdfDoc.text(performedCount.toString(), colPositions[3]!, currentY);

    currentY += rowHeight;
  });

  // Save PDF with descriptive filename
  const filename = `Liste_Chants_${new Date().toISOString().split('T')[0]}.pdf`;
  pdfDoc.save(filename);
};
