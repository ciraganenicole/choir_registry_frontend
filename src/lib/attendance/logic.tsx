/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import type { CellHookData, RowInput } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { useEffect, useState } from 'react';

import { api } from '@/config/api';

import type { User } from '../user/type';
import { Commission, UserCategory } from '../user/type';

// const API_BASE_URL = 'https://choir-registry.onrender.com';

// Simple logging utility that can be disabled in production
const log = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Error logging utility
const logError = (message: string, error: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(message, error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
  }
};

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
}

export enum AttendanceType {
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
}

export enum AttendanceEventType {
  REHEARSAL = 'REHEARSAL',
  SUNDAY_SERVICE = 'SUNDAY_SERVICE',
  LOUADO = 'LOUADO',
  MUSIC = 'MUSIC',
  COMMITTEE = 'COMMITTEE',
}

export enum JustificationReason {
  ILLNESS = 'ILLNESS',
  WORK = 'WORK',
  TRAVEL = 'TRAVEL',
  FAMILY_EMERGENCY = 'FAMILY_EMERGENCY',
  SCHOOL = 'SCHOOL',
  OTHER = 'OTHER',
}

export interface AttendanceRecord {
  id?: number;
  userId: number;
  date: string;
  status: AttendanceStatus;
  eventType: AttendanceEventType;
  timeIn?: string;
  type?: AttendanceType;
  justification?: JustificationReason;
}

interface AttendanceFilterDto {
  startDate?: string;
  endDate?: string;
  userId?: number;
  eventType?: AttendanceEventType;
  status?: AttendanceStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// Map event types to user categories and commissions
const eventTypeToUserMapping: Record<
  AttendanceEventType,
  {
    categories: UserCategory[];
    commissions: Commission[];
  }
> = {
  [AttendanceEventType.REHEARSAL]: {
    categories: [], // Empty array means all users are allowed
    commissions: [],
  },
  [AttendanceEventType.SUNDAY_SERVICE]: {
    categories: [], // Empty array means all users are allowed
    commissions: [],
  },
  [AttendanceEventType.LOUADO]: {
    categories: [UserCategory.WORSHIPPER],
    commissions: [],
  },
  [AttendanceEventType.COMMITTEE]: {
    categories: [UserCategory.COMMITTEE],
    commissions: [],
  },
  [AttendanceEventType.MUSIC]: {
    categories: [UserCategory.WORSHIPPER],
    commissions: [Commission.SINGING_MUSIC],
  },
};

// Function to check if a user belongs to an event type
const userBelongsToEventType = (
  user: User,
  eventType: AttendanceEventType,
): boolean => {
  const mapping = eventTypeToUserMapping[eventType];

  // Check if user has any of the required categories
  const hasRequiredCategory =
    mapping.categories.length === 0 ||
    mapping.categories.some((category) => user.categories.includes(category));

  // Check if user has any of the required commissions
  const hasRequiredCommission =
    mapping.commissions.length === 0 ||
    mapping.commissions.some((commission) =>
      user.commissions.includes(commission),
    );

  return hasRequiredCategory && hasRequiredCommission;
};

export const useAttendance = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<{
    [userId: number]: AttendanceRecord[];
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] =
    useState<AttendanceEventType>(AttendanceEventType.REHEARSAL);

  // Default filters (initially null for fetching all records)
  const [filters, setFilters] = useState<AttendanceFilterDto>({
    sortBy: 'date',
    sortOrder: 'DESC',
  });

  const getFilteredAttendance = (userId: number) => {
    const userAttendance = attendance[userId] || [];

    // If no filters are set, return all attendance records
    if (
      !filters.startDate &&
      !filters.endDate &&
      !filters.status &&
      !filters.eventType
    ) {
      return userAttendance;
    }

    return userAttendance.filter((record) => {
      // Date range filter
      const matchesDate =
        (!filters.startDate || record.date >= filters.startDate) &&
        (!filters.endDate || record.date <= filters.endDate);

      // Status filter
      const matchesStatus = !filters.status || record.status === filters.status;

      // Event type filter
      const matchesEventType =
        !filters.eventType || record.eventType === filters.eventType;

      return matchesDate && matchesStatus && matchesEventType;
    });
  };

  const fetchUsersAndAttendance = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      log('Fetching users...');

      // Add pagination parameters to get all users
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '1000'); // Set a high limit to get all users
      queryParams.append('page', '1');

      const response = await api.get(`/users?${queryParams.toString()}`);
      log('Users response:', response.data);

      // Check if the response has the expected structure
      const usersData = response.data.data || [];
      const totalUsers = response.data.total || usersData.length;

      log('Processed users data:', usersData);
      log('Total users:', totalUsers);

      setUsers(usersData);

      // Fetch attendance for each user
      const userAttendancePromises = usersData.map(async (user: User) => {
        try {
          // Create query parameters for attendance filters
          const attendanceParams = new URLSearchParams();

          // Add filters to the query parameters if they exist
          if (filters.startDate) {
            attendanceParams.append('startDate', filters.startDate);
          }
          if (filters.endDate) {
            attendanceParams.append('endDate', filters.endDate);
          }
          if (filters.status) {
            attendanceParams.append('status', filters.status);
          }
          if (filters.eventType) {
            attendanceParams.append('eventType', filters.eventType);
          }

          // Add pagination parameters to get all records
          attendanceParams.append('limit', '1000');
          attendanceParams.append('page', '1');

          const userAttendance = await api.get(
            `/attendance/user/${user.id}?${attendanceParams.toString()}`,
          );
          log(`Attendance for user ${user.id}:`, userAttendance.data);

          // Handle the response format: [records, total]
          const records =
            Array.isArray(userAttendance.data) && userAttendance.data.length > 0
              ? userAttendance.data[0] // First element is the array of records
              : [];

          return {
            userId: user.id,
            records: Array.isArray(records) ? records : [],
          };
        } catch (error) {
          logError(`Error fetching attendance for user ${user.id}:`, error);
          return { userId: user.id, records: [] };
        }
      });

      const userAttendanceResults = await Promise.all(userAttendancePromises);
      const mergedAttendance: { [userId: number]: AttendanceRecord[] } = {};
      userAttendanceResults.forEach((result) => {
        mergedAttendance[result.userId] = result.records;
      });

      log('Merged attendance:', mergedAttendance);
      setAttendance(mergedAttendance);
    } catch (error) {
      logError('Error fetching users or attendance:', error);
      setErrorMessage('Failed to fetch attendance data. Please try again.');
      setUsers([]);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch or when important filters change
    if (
      !users.length || // Add this condition for initial fetch
      filters.startDate ||
      filters.endDate ||
      filters.status ||
      filters.eventType
    ) {
      log('Fetching data with filters:', filters);
      fetchUsersAndAttendance();
    }
  }, [filters.startDate, filters.endDate, filters.status, filters.eventType]);

  const markAttendance = async (
    userId: number,
    data: Partial<AttendanceRecord>,
  ) => {
    try {
      const response = await api.post('/attendance/manual', {
        ...data,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  };

  // Add function to handle event type change
  const changeEventType = (eventType: AttendanceEventType) => {
    setSelectedEventType(eventType);
  };

  // Enhanced error handling utility for export operations
  const handleExportError = (error: unknown, operation: string): string => {
    let message = `Failed to ${operation}`;

    if (error instanceof Error) {
      message += `: ${error.message}`;
      logError(message, error);
    } else if (typeof error === 'string') {
      message += `: ${error}`;
      logError(message, { stringError: error });
    } else {
      logError(message, { unknownError: error });
    }

    return message;
  };

  const exportAttendance = async (
    exportFilters: AttendanceFilterDto,
    exportMonth?: number,
    exportYear?: number,
  ) => {
    try {
      // If no month/year provided, use current month/year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Use provided month/year or defaults
      const monthToUse =
        typeof exportMonth === 'number' ? exportMonth : currentMonth;
      const yearToUse =
        typeof exportYear === 'number' ? exportYear : currentYear;

      // Create date safely
      const currentDate = new Date(yearToUse, monthToUse);
      if (Number.isNaN(currentDate.getTime())) {
        throw new Error('Invalid date created from month and year');
      }

      // Get month name safely
      let monthName;
      try {
        monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
      } catch (e) {
        monthName = String(monthToUse + 1).padStart(2, '0');
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      if (!workbook) {
        throw new Error('Failed to create Excel workbook');
      }

      const worksheet = workbook.addWorksheet('Attendance');

      // Set default row height and column widths
      worksheet.properties.defaultRowHeight = 20;
      worksheet.getColumn('A').width = 4;
      worksheet.getColumn('B').width = 15;
      worksheet.getColumn('C').width = 15;

      // Add logo
      try {
        const response = await fetch('/assets/images/logo.jpeg');
        const blob = await response.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const logoId = workbook.addImage({
          base64: base64.split(',')[1],
          extension: 'jpeg',
        });

        // Position logo to match the image exactly
        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          ext: { width: 100, height: 100 }, // Increased size
        });
      } catch (error) {
        console.warn('Failed to add logo to worksheet:', error);
      }

      // Add organization headers with proper spacing
      worksheet.mergeCells('C1:Z1');
      const orgNameCell = worksheet.getCell('C1');
      orgNameCell.value =
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE';
      orgNameCell.font = { name: 'Arial', size: 12, bold: true };
      orgNameCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells('C2:Z2');
      const celpaCell = worksheet.getCell('C2');
      celpaCell.value = '5è CELPA SALEM GOMA';
      celpaCell.font = { name: 'Arial', size: 12, bold: true };
      celpaCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells('C3:Z3');
      const choirCell = worksheet.getCell('C3');
      choirCell.value = 'CHORALE LA NOUVELLE JERUSALEM';
      choirCell.font = { name: 'Arial', size: 12, bold: true };
      choirCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells('A4:Z4');
      const registreCell = worksheet.getCell('A4');
      registreCell.value = 'REGISTRE DES PRESENCES';
      registreCell.font = { name: 'Arial', size: 14, bold: true };
      registreCell.alignment = { horizontal: 'left', vertical: 'middle' };

      // Add month text with proper spacing
      worksheet.mergeCells('A5:C5');
      const monthCell = worksheet.getCell('A5');
      const monthText = (() => {
        if (exportFilters.startDate) {
          // Use the filtered date's month if available
          const filterDate = new Date(exportFilters.startDate);
          const filterMonth = filterDate.toLocaleString('fr-FR', {
            month: 'long',
          });
          const filterYear = filterDate.getFullYear();
          return `Mois de : ${filterMonth.toUpperCase()}-${filterYear}`;
        }
        // Otherwise use the provided export month or current month
        return `Mois de : ${monthName.toUpperCase()}-${yearToUse}`;
      })();
      monthCell.value = monthText;
      monthCell.font = { name: 'Arial', size: 11, bold: true };
      monthCell.alignment = { horizontal: 'left', vertical: 'middle' };

      // Set row heights for proper spacing
      worksheet.getRow(1).height = 25;
      worksheet.getRow(2).height = 25;
      worksheet.getRow(3).height = 25;
      worksheet.getRow(4).height = 30;
      worksheet.getRow(5).height = 25;

      // Add "FREQUENTATIONS JOURNALIERES" header
      worksheet.mergeCells('A6:Z6');
      const freqCell = worksheet.getCell('A6');
      freqCell.value = 'FREQUENTATIONS JOURNALIERES';
      freqCell.font = { name: 'Arial', size: 12, bold: true };
      freqCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Set consistent row heights for header section
      worksheet.getRow(1).height = 20;
      worksheet.getRow(2).height = 20;
      worksheet.getRow(3).height = 20;
      worksheet.getRow(4).height = 20;
      worksheet.getRow(5).height = 20;
      worksheet.getRow(6).height = 25;

      // Set up the main table headers
      worksheet.getCell('A7').value = '#';
      worksheet.getCell('B7').value = 'Prenom';
      worksheet.getCell('C7').value = 'Nom';

      // Get all dates in the month or use all unique dates from attendance records
      let datesInMonth: Date[] = [];
      if (exportMonth !== undefined && exportYear !== undefined) {
        const lastDay = new Date(yearToUse, monthToUse + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day += 1) {
          const monthDate = new Date(yearToUse, monthToUse, day);
          datesInMonth.push(monthDate);
        }
      } else {
        // Get all unique dates from attendance records
        const uniqueDates = new Set<string>();
        Object.values(attendance).forEach((userRecords) => {
          userRecords.forEach((record) => {
            uniqueDates.add(record.date);
          });
        });
        datesInMonth = Array.from(uniqueDates)
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());
      }

      // Add date columns
      let colIndex = 4; // Starting from column D
      datesInMonth.forEach((monthDate: Date) => {
        const col = worksheet.getColumn(colIndex);
        col.width = 4;
        worksheet.getCell(7, colIndex).value = monthDate.getDate();
        colIndex += 1;
      });

      // Add summary columns
      const summaryHeaders = ['Présences', 'Absences', 'Retards'];
      summaryHeaders.forEach((header) => {
        worksheet.getCell(7, colIndex).value = header;
        worksheet.getColumn(colIndex).width = 12;
        colIndex += 1;
      });

      // Style all header cells
      worksheet.getRow(7).eachCell((cell) => {
        const headerCell = cell;
        headerCell.font = { name: 'Arial', size: 10, bold: true };
        headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        headerCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E2E8F0' },
        };
      });

      // Add data rows
      let rowIndex = 8;
      let memberIndex = 1;

      // Sort users by firstName
      const sortedUsers = [...users].sort((a, b) =>
        a.firstName.localeCompare(b.firstName),
      );

      sortedUsers.forEach((user) => {
        const userAttendance = attendance[user.id] || [];
        const row = worksheet.getRow(rowIndex);

        // Add user info
        row.getCell(1).value = memberIndex;
        row.getCell(2).value = user.firstName;
        row.getCell(3).value = user.lastName;

        // Initialize counters
        let presences = 0;
        let absences = 0;
        let retards = 0;

        // Fill attendance for each date
        colIndex = 4; // Reset to column D
        datesInMonth.forEach((date: Date) => {
          const dateStr = date.toISOString().split('T')[0];
          const record = userAttendance.find((r) => r.date === dateStr);

          let value = '*';
          if (record) {
            switch (record.status) {
              case AttendanceStatus.PRESENT:
                value = 'P';
                presences += 1;
                break;
              case AttendanceStatus.ABSENT:
                value = 'A';
                absences += 1;
                break;
              case AttendanceStatus.LATE:
                value = 'R';
                retards += 1;
                break;
              default:
                value = '*';
                break;
            }
          }

          const cell = row.getCell(colIndex);
          cell.value = value;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 10 };

          // Color coding
          if (value === 'P') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'C6E0B4' }, // Light green for present
            };
          } else if (value === 'A') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFB6C1' }, // Light red for absent
            };
          } else if (value === 'R') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC000' }, // Orange for late
            };
          }

          colIndex += 1;
        });

        // Add summary counts
        row.getCell(colIndex).value = presences;
        row.getCell(colIndex + 1).value = absences;
        row.getCell(colIndex + 2).value = retards;

        // Style the entire row
        row.eachCell((cell) => {
          const dataCell = cell;
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        rowIndex += 1;
        memberIndex += 1;
      });

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      if (!buffer) {
        throw new Error('Failed to generate Excel file');
      }

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      if (!blob) {
        throw new Error('Failed to create file blob');
      }

      const url = window.URL.createObjectURL(blob);
      if (!url) {
        throw new Error('Failed to create object URL');
      }

      const link = document.createElement('a');
      if (!link) {
        throw new Error('Failed to create download link');
      }

      // Generate filename based on whether we're exporting a specific month or all dates
      const filename =
        exportMonth !== undefined && exportYear !== undefined
          ? `registre_presences_${monthName}_${yearToUse}.xlsx`
          : `registre_presences_toutes_dates.xlsx`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const exportError = handleExportError(
        error,
        'export attendance to Excel',
      );
      throw new Error(exportError);
    }
  };

  const exportAttendanceToPDF = async (
    exportFilters: AttendanceFilterDto,
    exportMonth?: number,
    exportYear?: number,
  ) => {
    try {
      // If no month/year provided, use current month/year
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Use provided month/year or defaults
      const monthToUse =
        typeof exportMonth === 'number' ? exportMonth : currentMonth;
      const yearToUse =
        typeof exportYear === 'number' ? exportYear : currentYear;

      // Create date safely
      const currentDate = new Date(yearToUse, monthToUse);
      if (Number.isNaN(currentDate.getTime())) {
        throw new Error('Invalid date created from month and year');
      }

      // Get month name safely
      let monthName;
      try {
        monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
      } catch (e) {
        monthName = String(monthToUse + 1).padStart(2, '0');
      }

      // Create PDF document with consistent margins
      const Doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 15; // Set consistent 15mm margin for all sides

      // Add logo
      try {
        const response = await fetch('/assets/images/Wlogo.png');
        const blob = await response.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        Doc.addImage(base64, 'PNG', 15, 15, 35, 20); // Adjusted size and position
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }

      // Add header text with exact positioning
      Doc.setFontSize(11);
      Doc.setFont('helvetica', 'bold');
      Doc.text(
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
        margin + 30,
        20,
      );
      Doc.text('5è CELPA SALEM GOMA', margin + 30, 25);
      Doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 30);

      Doc.setFontSize(12);
      Doc.text('REGISTRE DES PRESENCES', margin, 45);

      Doc.setFontSize(10);
      Doc.text('Mois de :', margin, 52);

      // Get the month text based on filters or current date
      const monthText = (() => {
        if (exportFilters.startDate) {
          // Use the filtered date's month if available
          const filterDate = new Date(exportFilters.startDate);
          const filterMonth = filterDate.toLocaleString('fr-FR', {
            month: 'long',
          });
          const filterYear = filterDate.getFullYear();
          return `Mois de : ${filterMonth.toUpperCase()}-${filterYear}`;
        }
        // Otherwise use the provided export month or current month
        return `Mois de : ${monthName.toUpperCase()}-${yearToUse}`;
      })();

      Doc.text(monthText, margin + 20, 52);

      // Add "FREQUENTATIONS JOURNALIERES" header
      Doc.setFontSize(11);
      Doc.text('FREQUENTATIONS JOURNALIERES', margin, 60);

      // Add "Statistiques" text aligned to the right
      Doc.text('Statistiques', 250, 60);

      // Get all dates in the month or use all unique dates from attendance records
      let datesInMonth: Date[] = [];
      if (exportMonth !== undefined && exportYear !== undefined) {
        const lastDay = new Date(yearToUse, monthToUse + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day += 1) {
          const monthDate = new Date(yearToUse, monthToUse, day);
          datesInMonth.push(monthDate);
        }
      } else {
        // Get all unique dates from attendance records
        const uniqueDates = new Set<string>();
        Object.values(attendance).forEach((userRecords) => {
          userRecords.forEach((record) => {
            uniqueDates.add(record.date);
          });
        });
        datesInMonth = Array.from(uniqueDates)
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());
      }

      // Keep the original formatFullDate function
      const formatFullDate = (date: Date | undefined): string => {
        if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
          return '';
        }

        try {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${day}/${month}`;
        } catch (e) {
          const [, month, day] = date.toISOString().substring(0, 10).split('-');
          return `${day}/${month}`;
        }
      };

      // Prepare table data with proper typing
      const tableData: (string | number)[][] = [];
      const sortedUsers = [...users].sort((a, b) =>
        a.firstName.localeCompare(b.firstName),
      );

      // Add headers
      const headers: string[] = ['#', 'Prenom', 'Nom'];

      // Add date headers
      datesInMonth.forEach((date) => {
        headers.push(formatFullDate(date));
      });

      headers.push('Presences', 'Absences', 'Retards');
      tableData.push(headers);

      // Add user data
      let memberIndex = 1;
      sortedUsers.forEach((user) => {
        const userAttendance = attendance[user.id] || [];
        const row = [memberIndex, user.firstName, user.lastName];

        let presences = 0;
        let absences = 0;
        let retards = 0;

        datesInMonth.forEach((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const record = userAttendance.find((r) => r.date === dateStr);

          let value = '*';
          if (record) {
            switch (record.status) {
              case AttendanceStatus.PRESENT:
                value = 'P';
                presences += 1;
                break;
              case AttendanceStatus.ABSENT:
                value = 'A';
                absences += 1;
                break;
              case AttendanceStatus.LATE:
                value = 'R';
                retards += 1;
                break;
              default:
                value = '*';
                break;
            }
          }
          row.push(value);
        });

        row.push(presences.toString(), absences.toString(), retards.toString());
        tableData.push(row);
        memberIndex += 1;
      });

      // Update table styling with proper types
      autoTable(Doc, {
        head: [headers],
        body: tableData.slice(1) as RowInput[],
        startY: 65,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        theme: 'grid',
        styles: {
          fontSize: 6,
          cellPadding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          lineWidth: 0.1,
          fontSize: 6,
        },
        columnStyles: {
          0: { cellWidth: 5, halign: 'center' }, // # column
          1: { cellWidth: 18 }, // Prenom
          2: { cellWidth: 18 }, // Nom
          // Date columns - increased width for horizontal date display
          ...Array.from({ length: datesInMonth.length }, (_, i) => ({
            [i + 3]: {
              cellWidth: 9, // Increased from 4.5 to 7mm to fit dates horizontally
            },
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
          // Summary columns
          [headers.length - 3]: { cellWidth: 18 }, // Presences
          [headers.length - 2]: { cellWidth: 18 }, // Absences
          [headers.length - 1]: { cellWidth: 18 }, // Retards
        },
        didParseCell: (hookData: CellHookData) => {
          const styles = { ...hookData.cell.styles };

          styles.lineWidth = 0.1;
          styles.lineColor = [0, 0, 0];

          if (hookData.column.index > 2) {
            styles.halign = 'center';
          }

          if (
            hookData.section === 'body' &&
            hookData.column.index >= 3 &&
            hookData.column.index < headers.length - 3
          ) {
            const value = hookData.cell.raw as string;
            if (value === 'P') {
              styles.fillColor = [198, 224, 180];
            } else if (value === 'A') {
              styles.fillColor = [255, 182, 193];
            } else if (value === 'R') {
              styles.fillColor = [255, 192, 0];
            }
          }

          if (hookData.section === 'body' && hookData.row.index % 2 === 0) {
            if (!styles.fillColor) {
              styles.fillColor = [240, 240, 240];
            }
          }

          if (
            hookData.section === 'head' &&
            hookData.column.index >= 3 &&
            hookData.column.index < headers.length - 3
          ) {
            styles.fontSize = 7;
            styles.cellPadding = {
              top: 1,
              right: 1,
              bottom: 1,
              left: 1,
            };
            styles.halign = 'center';
            styles.valign = 'middle';
          }

          if (
            hookData.section === 'body' &&
            hookData.column.index >= 3 &&
            hookData.column.index < headers.length - 3
          ) {
            styles.fontStyle = 'bold';
            styles.fontSize = 8;
          }

          if (hookData.column.index <= 2 && hookData.section === 'body') {
            styles.fontSize = 8;
          }

          if (hookData.column.index >= headers.length - 3) {
            styles.fontSize = 8;
            styles.fontStyle = 'bold';
          }

          Object.assign(hookData.cell.styles, styles);
        },
      });

      // Generate filename
      const filename =
        exportMonth !== undefined && exportYear !== undefined
          ? `registre_presences_${monthName}_${yearToUse}.pdf`
          : `registre_presences_toutes_dates.pdf`;

      // Save PDF
      Doc.save(filename);
    } catch (error) {
      const exportError = handleExportError(error, 'export attendance to PDF');
      throw new Error(exportError);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;

    // First filter by event type
    if (!userBelongsToEventType(user, selectedEventType)) {
      return false;
    }

    // Then filter by search term if it exists
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      if (!fullName.includes(searchTerm)) {
        return false;
      }
    }

    const userAttendance = attendance[user.id] || [];

    const matchesStatus =
      !filters.status ||
      userAttendance.some((record) => record.status === filters.status);

    const matchesDate =
      !filters.startDate ||
      !filters.endDate ||
      userAttendance.some(
        (record) =>
          record.date >= filters.startDate! && record.date <= filters.endDate!,
      );

    return matchesStatus && matchesDate;
  });

  return {
    users,
    attendance,
    markAttendance,
    loading,
    errorMessage,
    filters,
    setFilters,
    getFilteredAttendance,
    exportAttendance,
    exportAttendanceToPDF,
    selectedEventType,
    changeEventType,
    filteredUsers,
    fetchUsersAndAttendance,
  };
};
