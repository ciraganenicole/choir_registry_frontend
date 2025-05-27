/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
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
    // eslint-disable-next-line no-console
    if (data) {
      // eslint-disable-next-line no-console
      console.log(message, data);
    } else {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  }
};

// Error logging utility
const logError = (message: string, error: any) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(message, error);
    if (axios.isAxiosError(error)) {
      // eslint-disable-next-line no-console
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
  BIRTH = 'BIRTH',
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

  // Fetch on first mount only
  useEffect(() => {
    if (!users.length) {
      log('Fetching data on first mount');
      fetchUsersAndAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when filters change, but only if users are already loaded
  useEffect(() => {
    if (users.length) {
      log('Fetching data with filters:', filters);
      fetchUsersAndAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const updateAttendance = async (
    id: number,
    data: Partial<AttendanceRecord>,
  ) => {
    try {
      const response = await api.put(`/attendance/${id}`, data);

      // Refresh attendance data after update
      await fetchUsersAndAttendance();

      return response.data;
    } catch (error) {
      logError('Error updating attendance:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update attendance',
      );
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

      // Get month name safely using date-fns
      const monthIndex = (exportMonth ?? monthToUse) - 1;
      let monthName;
      try {
        monthName = format(new Date(yearToUse, monthIndex, 1), 'MMMM', {
          locale: fr,
        });
      } catch (e) {
        monthName = String(exportMonth ?? monthToUse).padStart(2, '0');
      }

      // Create PDF document with consistent margins
      const Doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 10; // Reduced margin from 15 to 10

      // Add logo
      try {
        const response = await fetch('/assets/images/Wlogo.png');
        const blob = await response.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        Doc.addImage(base64, 'PNG', 10, 10, 35, 20); // Adjusted y position from 15 to 10
      } catch (error) {
        // Remove console.warn
      }

      // Add header text with exact positioning
      Doc.setFontSize(11);
      Doc.setFont('helvetica', 'bold');
      Doc.text(
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
        margin + 30,
        15, // Adjusted from 20
      );
      Doc.text('5è CELPA SALEM GOMA', margin + 30, 20); // Adjusted from 25
      Doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 25); // Adjusted from 30

      Doc.setFontSize(12);
      Doc.text('REGISTRE DES PRESENCES', margin, 35); // Adjusted from 45

      Doc.setFontSize(10);
      Doc.text('Mois de :', margin, 42); // Adjusted from 52

      // Get all dates in the month or use all unique dates from attendance records
      let datesInMonth: Date[] = [];
      if (exportMonth !== undefined && exportYear !== undefined) {
        const lastDay = new Date(yearToUse, monthIndex + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day += 1) {
          const monthDate = new Date(yearToUse, monthIndex, day);
          datesInMonth.push(monthDate);
        }
      } else {
        // Get all unique dates from attendance records filtered by exportFilters
        const uniqueDates = new Set<string>();
        Object.values(attendance).forEach((userRecords) => {
          userRecords.forEach((record) => {
            // Apply exportFilters to filter dates
            if (
              (!exportFilters.startDate ||
                record.date >= exportFilters.startDate) &&
              (!exportFilters.endDate ||
                record.date <= exportFilters.endDate) &&
              (!exportFilters.eventType ||
                record.eventType === exportFilters.eventType) &&
              (!exportFilters.status || record.status === exportFilters.status)
            ) {
              uniqueDates.add(record.date);
            }
          });
        });
        datesInMonth = Array.from(uniqueDates)
          .map((dateStr) => new Date(dateStr))
          .sort((a, b) => a.getTime() - b.getTime());
      }

      // Get the month text based on the first date in the data
      let monthText = '';
      if (datesInMonth.length > 0 && datesInMonth[0]) {
        const firstDate = datesInMonth[0];
        const month = format(firstDate, 'MMMM', { locale: fr });
        const year = firstDate.getFullYear();
        monthText = `${month.toUpperCase()}-${year}`;
      } else {
        monthText = `${monthName.toUpperCase()}-${yearToUse}`;
      }

      Doc.text(monthText, margin + 20, 42);

      // Add "FREQUENTATIONS JOURNALIERES" header
      Doc.setFontSize(11);
      Doc.text('FREQUENTATIONS JOURNALIERES', margin, 50);

      // Add "Statistiques" text aligned to the right
      Doc.text('Statistiques', 250, 50);

      // Set the month name and year for the header based on the first date in the table
      let monthNameForHeader = '';
      let yearForHeader = yearToUse;
      if (
        datesInMonth.length > 0 &&
        datesInMonth[0] instanceof Date &&
        !Number.isNaN(datesInMonth[0].getTime())
      ) {
        monthNameForHeader = format(datesInMonth[0], 'MMMM', { locale: fr });
        yearForHeader = datesInMonth[0].getFullYear();
      } else {
        monthNameForHeader = format(
          new Date(yearToUse, monthIndex, 1),
          'MMMM',
          { locale: fr },
        );
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

      headers.push('P', 'A', 'R');
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
        startY: 55,
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
          0: { cellWidth: 8, halign: 'left' }, // # column, increased from 5
          1: { cellWidth: 24 }, // Prenom, increased from 18
          2: { cellWidth: 24 }, // Nom, increased from 18
          // Date columns - increased width for horizontal date display
          ...Array.from({ length: datesInMonth.length }, (_, i) => ({
            [i + 3]: {
              cellWidth: 9, // Increased from 4.5 to 7mm to fit dates horizontally
            },
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
          // Summary columns
          [headers.length - 3]: { cellWidth: 8 }, // Presence
          [headers.length - 2]: { cellWidth: 8 }, // Absence
          [headers.length - 1]: { cellWidth: 8 }, // Retard
        },
        didParseCell: (hookData: CellHookData) => {
          const styles = { ...hookData.cell.styles };

          styles.lineWidth = 0.1;
          styles.lineColor = [0, 0, 0];
          styles.cellPadding = { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };

          if (hookData.column.index > 2) {
            styles.halign = 'center';
          }

          // Reduce font size for the last three header columns
          if (
            hookData.section === 'head' &&
            hookData.column.index >= headers.length - 3
          ) {
            styles.fontSize = 5;
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
          ? `registre_presences_${monthNameForHeader}_${yearForHeader}.pdf`
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

    // NEW: Only include active users or inactive newcomers
    const isInactiveNewcomer =
      !user.isActive && user.categories.includes(UserCategory.NEWCOMER);
    const { isActive } = user;
    if (!(isActive || isInactiveNewcomer)) return false;

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
    updateAttendance,
    loading,
    errorMessage,
    filters,
    setFilters,
    getFilteredAttendance,
    exportAttendanceToPDF,
    selectedEventType,
    changeEventType,
    filteredUsers,
    fetchUsersAndAttendance,
    setAttendance,
  };
};
