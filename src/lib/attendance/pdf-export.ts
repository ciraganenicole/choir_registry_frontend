/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { jsPDF } from 'jspdf';
import type { CellHookData, RowInput } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

import type { AttendanceRecord } from './types';

interface ContributionData {
  userId: number;
  totalAmountFC: number;
  totalAmountUSD: number;
}

export const exportUnjustifiedWeeklyAbsencesToPDF = async (
  absences: AttendanceRecord[],
  contributions?: ContributionData[],
) => {
  try {
    if (!absences || absences.length === 0) {
      throw new Error('Aucune absence non justifiée trouvée');
    }

    // Sort absences by date (ascending), then by user last name
    const sortedAbsences = [...absences].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      const lastNameA = a.user?.lastName || '';
      const lastNameB = b.user?.lastName || '';
      return lastNameA.localeCompare(lastNameB);
    });

    // Extract unique dates (should be Wednesday and Saturday)
    const uniqueDates = Array.from(
      new Set(sortedAbsences.map((a) => a.date)),
    ).sort();

    if (uniqueDates.length === 0) {
      throw new Error('Aucune date trouvée dans les absences');
    }

    if (uniqueDates.length < 2) {
      throw new Error(
        'Les absences doivent contenir à la fois les dates du mercredi et du samedi',
      );
    }

    const wednesdayDate = uniqueDates[0]!;
    const saturdayDate = uniqueDates[1]!;

    // Group absences by userId
    const absencesByUser = new Map<number, AttendanceRecord[]>();
    sortedAbsences.forEach((absence) => {
      if (!absencesByUser.has(absence.userId)) {
        absencesByUser.set(absence.userId, []);
      }
      absencesByUser.get(absence.userId)!.push(absence);
    });

    // Create PDF document
    const Doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const margin = 10;

    // Add logo
    try {
      const response = await fetch('/assets/images/Wlogo.png');
      const blob = await response.blob();
      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      Doc.addImage(base64, 'PNG', 10, 10, 35, 20);
    } catch (error) {
      // Silently ignore image loading errors - PDF will still be generated without logo
      console.warn('Failed to add logo to PDF:', error);
    }

    // Add organization header
    Doc.setFontSize(11);
    Doc.setFont('helvetica', 'bold');
    Doc.text(
      'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
      margin + 30,
      15,
    );
    Doc.text('5è CELPA SALEM GOMA', margin + 30, 20);
    Doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 25);

    // Add title
    Doc.setFontSize(12);
    Doc.text('ABSENCES NON JUSTIFIEES - REPETITIONS HEBDOMADAIRES', margin, 35);

    // Add week period
    Doc.setFontSize(10);
    const formatDateForDisplay = (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        return format(date, 'dd/MM/yyyy', { locale: fr });
      } catch {
        return dateStr;
      }
    };

    const weekText = `Semaine du ${formatDateForDisplay(wednesdayDate)} au ${formatDateForDisplay(saturdayDate)}`;

    Doc.text(weekText, margin, 42);

    // Prepare table data
    const tableData: (string | number)[][] = [];
    const headers: string[] = [
      '#',
      'Prenom',
      'Nom',
      'Total Contribution (FC)',
      'Total Contribution (USD)',
    ];
    tableData.push(headers);

    // Create rows for each user with absences
    let memberIndex = 1;
    const sortedUserIds = Array.from(absencesByUser.keys()).sort((a, b) => {
      const userA = absencesByUser.get(a)?.[0]?.user;
      const userB = absencesByUser.get(b)?.[0]?.user;
      const lastNameA = userA?.lastName || '';
      const lastNameB = userB?.lastName || '';
      return lastNameA.localeCompare(lastNameB);
    });

    sortedUserIds.forEach((userId) => {
      const userAbsences = absencesByUser.get(userId) || [];
      const firstAbsence = userAbsences[0];
      const user = firstAbsence?.user;

      if (!user) return;

      // Get contribution data for this user
      const userContribution = contributions?.find((c) => c.userId === userId);
      const totalFC = userContribution?.totalAmountFC || 0;
      const totalUSD = userContribution?.totalAmountUSD || 0;

      const row: (string | number)[] = [
        memberIndex,
        user.lastName || '',
        user.firstName || '',
        totalFC,
        totalUSD,
      ];

      tableData.push(row);
      memberIndex += 1;
    });

    // Generate table
    autoTable(Doc, {
      head: [headers],
      body: tableData.slice(1) as RowInput[],
      startY: 50,
      margin: { top: margin, right: margin, bottom: margin, left: margin },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
        lineWidth: 0.1,
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'left' }, // # column
        1: { cellWidth: 24, halign: 'left' }, // Prenom
        2: { cellWidth: 24, halign: 'left' }, // Nom
        3: { cellWidth: 30, halign: 'right' }, // Total FC
        4: { cellWidth: 30, halign: 'right' }, // Total USD
      },
      didParseCell: (hookData: CellHookData) => {
        const styles = { ...hookData.cell.styles };

        styles.lineWidth = 0.1;
        styles.lineColor = [0, 0, 0];
        styles.cellPadding = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };

        // Right align contribution columns
        if (hookData.column.index >= 3) {
          styles.halign = 'right';
        }

        // Alternate row colors
        if (hookData.section === 'body' && hookData.row.index % 2 === 0) {
          if (!styles.fillColor) {
            styles.fillColor = [240, 240, 240];
          }
        }

        // Contribution header styling
        if (
          hookData.section === 'head' &&
          hookData.column.index >= 3 &&
          hookData.column.index < headers.length
        ) {
          styles.fontSize = 8;
          styles.cellPadding = {
            top: 1,
            right: 1,
            bottom: 1,
            left: 1,
          };
          styles.halign = 'right';
          styles.valign = 'middle';
        }

        // Body contribution cells styling
        if (
          hookData.section === 'body' &&
          hookData.column.index >= 3 &&
          hookData.column.index < headers.length
        ) {
          styles.fontSize = 8;
        }

        // Name columns styling
        if (hookData.column.index <= 2 && hookData.section === 'body') {
          styles.fontSize = 8;
        }

        Object.assign(hookData.cell.styles, styles);
      },
    });

    // Generate filename
    const weekDateStr = format(new Date(wednesdayDate), 'yyyy-MM-dd', {
      locale: fr,
    });
    const filename = `absences_non_justifiees_${weekDateStr}.pdf`;

    Doc.save(filename);
  } catch (error: any) {
    throw new Error(
      error.message || 'Failed to export unjustified absences to PDF',
    );
  }
};
