/* eslint-disable new-cap */
/* eslint-disable import/no-extraneous-dependencies */
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { jsPDF } from 'jspdf';
import type { CellHookData, RowInput } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/config/api';

import type { User } from '../user/type';
import { Commission, UserCategory } from '../user/type';

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

interface UseAttendanceOptions {
  auto?: boolean;
}

export const useAttendance = (options: UseAttendanceOptions = {}) => {
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

    if (
      !filters.startDate &&
      !filters.endDate &&
      !filters.status &&
      !filters.eventType
    ) {
      return userAttendance;
    }

    return userAttendance.filter((record) => {
      const matchesDate =
        (!filters.startDate || record.date >= filters.startDate) &&
        (!filters.endDate || record.date <= filters.endDate);

      const matchesStatus = !filters.status || record.status === filters.status;

      const matchesEventType =
        !filters.eventType || record.eventType === filters.eventType;

      return matchesDate && matchesStatus && matchesEventType;
    });
  };

  const serializedFilters = useMemo(
    () =>
      JSON.stringify({
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        eventType: filters.eventType,
      }),
    [filters.startDate, filters.endDate, filters.status, filters.eventType],
  );

  const fetchUsersAndAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '50'); // Fetch a manageable subset to avoid flooding
      queryParams.append('page', '1');

      const response = await api.get(`/users?${queryParams.toString()}`);

      let usersData: User[] = [];

      if (Array.isArray(response.data) && response.data.length === 2) {
        const [usersFromResponse] = response.data;
        usersData = usersFromResponse || [];
      } else if (response.data && response.data.data) {
        usersData = response.data.data || [];
      } else {
        usersData = Array.isArray(response.data) ? response.data : [];
      }

      setUsers(usersData);

      const userAttendancePromises = usersData.map(async (user: User) => {
        try {
          const attendanceParams = new URLSearchParams();
          const parsedFilters = JSON.parse(serializedFilters) as {
            startDate?: string;
            endDate?: string;
            status?: AttendanceStatus;
            eventType?: AttendanceEventType;
          };

          if (parsedFilters.startDate) {
            attendanceParams.append('startDate', parsedFilters.startDate);
          }
          if (parsedFilters.endDate) {
            attendanceParams.append('endDate', parsedFilters.endDate);
          }
          if (parsedFilters.status) {
            attendanceParams.append('status', parsedFilters.status);
          }
          if (parsedFilters.eventType) {
            attendanceParams.append('eventType', parsedFilters.eventType);
          }

          attendanceParams.append('limit', '200');
          attendanceParams.append('page', '1');

          const userAttendance = await api.get(
            `/attendance/user/${user.id}?${attendanceParams.toString()}`,
          );

          const records =
            Array.isArray(userAttendance.data) && userAttendance.data.length > 0
              ? userAttendance.data[0]
              : [];

          return {
            userId: user.id,
            records: Array.isArray(records) ? records : [],
          };
        } catch (error) {
          return { userId: user.id, records: [] };
        }
      });

      const userAttendanceResults = await Promise.all(userAttendancePromises);
      const mergedAttendance: { [userId: number]: AttendanceRecord[] } = {};
      userAttendanceResults.forEach((result) => {
        mergedAttendance[result.userId] = result.records;
      });
      setAttendance(mergedAttendance);
    } catch (error) {
      setErrorMessage('Failed to fetch attendance data. Please try again.');
      setUsers([]);
      setAttendance({});
    } finally {
      setLoading(false);
    }
  }, [serializedFilters]);

  useEffect(() => {
    if (options.auto !== false) {
      fetchUsersAndAttendance();
    }
  }, [options.auto, fetchUsersAndAttendance]);

  const markAttendance = async (
    userId: number,
    data: Partial<AttendanceRecord>,
  ) => {
    const response = await api.post('/attendance/manual', {
      ...data,
      userId,
    });
    return response.data;
  };

  const updateAttendance = async (
    id: number,
    data: Partial<AttendanceRecord>,
  ) => {
    try {
      const response = await api.put(`/attendance/${id}`, data);

      await fetchUsersAndAttendance();

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update attendance',
      );
    }
  };

  const changeEventType = (eventType: AttendanceEventType) => {
    setSelectedEventType(eventType);
  };

  const handleExportError = (error: unknown, operation: string): string => {
    let message = `Failed to ${operation}`;

    if (error instanceof Error) {
      message += `: ${error.message}`;
    } else if (typeof error === 'string') {
      message += `: ${error}`;
    }

    return message;
  };

  const exportAttendanceToPDF = async (
    exportFilters: AttendanceFilterDto,
    exportMonth?: number,
    exportYear?: number,
  ) => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthToUse =
        typeof exportMonth === 'number' ? exportMonth : currentMonth;
      const yearToUse =
        typeof exportYear === 'number' ? exportYear : currentYear;

      const currentDate = new Date(yearToUse, monthToUse);
      if (Number.isNaN(currentDate.getTime())) {
        throw new Error('Invalid date created from month and year');
      }

      const monthIndex = (exportMonth ?? monthToUse) - 1;
      let monthName;
      try {
        monthName = format(new Date(yearToUse, monthIndex, 1), 'MMMM', {
          locale: fr,
        });
      } catch (e) {
        monthName = String(exportMonth ?? monthToUse).padStart(2, '0');
      }

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

      Doc.setFontSize(11);
      Doc.setFont('helvetica', 'bold');
      Doc.text(
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
        margin + 30,
        15,
      );
      Doc.text('5è CELPA SALEM GOMA', margin + 30, 20);
      Doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 25);

      Doc.setFontSize(12);
      Doc.text('REGISTRE DES PRESENCES', margin, 35);

      Doc.setFontSize(10);
      Doc.text('Mois de :', margin, 42);

      let datesInMonth: Date[] = [];
      if (exportMonth !== undefined && exportYear !== undefined) {
        const lastDay = new Date(yearToUse, monthIndex + 1, 0).getDate();
        for (let day = 1; day <= lastDay; day += 1) {
          const monthDate = new Date(yearToUse, monthIndex, day);
          datesInMonth.push(monthDate);
        }
      } else {
        const uniqueDates = new Set<string>();
        Object.values(attendance).forEach((userRecords) => {
          userRecords.forEach((record) => {
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

      Doc.setFontSize(11);
      Doc.text('FREQUENTATIONS JOURNALIERES', margin, 50);

      Doc.text('Statistiques', 250, 50);

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

      const tableData: (string | number)[][] = [];
      const sortedUsers = [...users].sort((a, b) =>
        a.lastName.localeCompare(b.lastName),
      );

      const headers: string[] = ['#', 'Prenom', 'Nom'];

      datesInMonth.forEach((date) => {
        headers.push(formatFullDate(date));
      });

      headers.push('P', 'A', 'R');
      tableData.push(headers);

      let memberIndex = 1;
      sortedUsers.forEach((user) => {
        const userAttendance = attendance[user.id] || [];
        const row = [memberIndex, user.lastName, user.firstName];

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

      const filename =
        exportMonth !== undefined && exportYear !== undefined
          ? `registre_presences_${monthNameForHeader}_${yearForHeader}.pdf`
          : `registre_presences_toutes_dates.pdf`;

      Doc.save(filename);
    } catch (error) {
      const exportError = handleExportError(error, 'export attendance to PDF');
      throw new Error(exportError);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;

    if (!userBelongsToEventType(user, selectedEventType)) {
      return false;
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const fullName = `${user.lastName} ${user.firstName}`.toLowerCase();
      if (!fullName.includes(searchTerm)) {
        return false;
      }
    }

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
