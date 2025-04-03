import axios from 'axios';
import { useEffect, useState } from 'react';

import type { User } from '../admin/users/type';
import { useLeave } from '../leave/logic';

const API_BASE_URL = 'http://localhost:4000';

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
  OTHER = 'OTHER',
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
  id: number;
  userId: number;
  eventType: AttendanceEventType;
  date: string;
  timeIn?: string;
  status: AttendanceStatus;
  type: AttendanceType;
  justification?: JustificationReason;
  createdAt: string;
  updatedAt: string;
  user: User;
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

export const useAttendance = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<{
    [userId: number]: AttendanceRecord[];
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default filters (initially null for fetching all records)
  const [filters, setFilters] = useState<AttendanceFilterDto>({
    sortBy: 'date',
    sortOrder: 'DESC',
  });

  const { isUserOnLeave } = useLeave();

  const getFilteredAttendance = (userId: number) => {
    const userAttendance = attendance[userId] || [];
    return userAttendance.filter((record) => {
      const matchesDate =
        !filters.startDate ||
        !filters.endDate ||
        (record.date >= filters.startDate && record.date <= filters.endDate);
      const matchesStatus = !filters.status || record.status === filters.status;
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
      const response = await axios.get(`${API_BASE_URL}/users`);
      log('Users response:', response.data);

      const usersData = response.data.data || [];
      log('Processed users data:', usersData);
      setUsers(usersData);

      // Fetch attendance for each user
      const userAttendancePromises = usersData.map(async (user: User) => {
        try {
          const userAttendance = await axios.get(
            `${API_BASE_URL}/attendance/user/${user.id}`,
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
    fetchUsersAndAttendance();
  }, [filters]);

  const markAttendance = async (
    userId: number,
    attendanceData: Partial<AttendanceRecord>,
  ) => {
    if (isUserOnLeave(userId, attendanceData.date)) {
      log(`User ${userId} is on leave. Attendance not marked.`);
      return;
    }

    const formattedDate = attendanceData.date
      ? new Date(attendanceData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const user = users.find((u) => u.id === userId);

    if (!user) {
      setErrorMessage('User not found.');
      return;
    }

    setLoading(true);
    try {
      log('Marking attendance:', { userId, attendanceData });
      const response = await axios.post(`${API_BASE_URL}/attendance/mark`, {
        userId,
        status: attendanceData.status,
        eventType: attendanceData.eventType || AttendanceEventType.REHEARSAL,
        date: formattedDate,
        timeIn:
          attendanceData.timeIn ||
          new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        type: AttendanceType.MANUAL,
        justification: attendanceData.justification,
      });
      log('Mark attendance response:', response.data);

      if (response.data.success) {
        await fetchUsersAndAttendance();
        setErrorMessage(null);
      } else {
        setErrorMessage('Failed to mark attendance. Please try again.');
      }
    } catch (error) {
      logError('Error marking attendance:', error);
      setErrorMessage('There was an issue marking attendance.');
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance/export`, {
        params: filters,
        responseType: 'blob',
        withCredentials: true,
      });

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `attendance-${new Date().toISOString().split('T')[0]}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to export attendance data');
      }
    } catch (error) {
      logError('Error exporting attendance:', error);
      setErrorMessage('Failed to export attendance data. Please try again.');
    }
  };

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
  };
};
