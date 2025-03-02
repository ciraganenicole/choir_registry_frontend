import axios from 'axios';
import { useEffect, useState } from 'react';

import type { User } from '../admin/users/type';
import { useLeave } from '../leave/logic';

const API_BASE_URL = 'http://localhost:4000';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

export enum EventType {
  NORMAL = 'NORMAL',
  WORSHIPPER = 'WORSHIPPER',
  COMMITTEE = 'COMMITTEE',
  MUSIC = 'MUSIC',
  SUNDAY_SERVICE = 'SUNDAY_SERVICE',
  SPECIAL = 'SPECIAL',
}

interface AttendanceRecord {
  date: string;
  dateTime: string;
  status: AttendanceStatus;
  justified: boolean;
  eventType: EventType;
}

interface Attendance {
  [userId: number]: AttendanceRecord[];
}

export const EventSchedule: Record<
  EventType,
  {
    days: number[];
    time: string;
    lateAfterMinutes?: number;
    absentAfterTime?: string;
  } | null
> = {
  [EventType.NORMAL]: {
    days: [3, 6],
    time: '13:30',
    lateAfterMinutes: 40,
    absentAfterTime: '16:30',
  },
  [EventType.WORSHIPPER]: {
    days: [4],
    time: '14:00',
    lateAfterMinutes: 70,
    absentAfterTime: '16:30',
  },
  [EventType.SUNDAY_SERVICE]: {
    days: [0],
    time: '09:00',
    lateAfterMinutes: 50,
  },
  [EventType.COMMITTEE]: null,
  [EventType.MUSIC]: null,
  [EventType.SPECIAL]: null,
};

const fetchAttendance = async (userId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/attendance/${userId}`);
    if (response.data.success) {
      return {
        [userId]: response.data.data.map((entry: AttendanceRecord) => ({
          ...entry,
          status: entry.status as AttendanceStatus,
        })),
      };
    }
    return { [userId]: [] };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return { [userId]: [] };
  }
};

export const useAttendance = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isUserOnLeave } = useLeave();

  const fetchUsersAndAttendance = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await axios.get(`${API_BASE_URL}/users`);
      setUsers(usersData);

      const attendanceResults = await Promise.all(
        usersData.map((user: User) => fetchAttendance(user.id)),
      );

      const mergedAttendance: Attendance = attendanceResults.reduce(
        (acc, userAttendance) => ({ ...acc, ...userAttendance }),
        {},
      );

      setAttendance(mergedAttendance);
    } catch (error) {
      console.error('Error fetching users or attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndAttendance();
  }, []);

  const markAttendance = async (
    userId: number,
    { date, status, justified = false, eventType }: AttendanceRecord,
  ) => {
    if (isUserOnLeave(userId, date)) {
      console.warn(`User ${userId} is on leave. Attendance not marked.`);
      return;
    }

    // Ensure date is properly formatted
    const formattedDate = date
      ? new Date(date).toISOString().split('T')[0]
      : '1970-01-01'; // Default date if date is undefined

    const user = users.find((u) => u.id === userId);

    // Check if the user is authorized to attend the event based on their category
    if (
      !user
      // ![EventType.WORSHIPPER, EventType.COMMITTEE].includes(user.category)
    ) {
      setErrorMessage('You are not authorized to attend this event.');
      console.warn(
        `User ${userId} is not authorized for event type ${eventType}.`,
      );
      return;
    }

    // Ensure the event category is allowed for this user
    const event = EventSchedule[eventType];
    if (!event || event === null) {
      setErrorMessage(
        'This event does not exist or is not available for your category.',
      );
      return;
    }

    // Check if the user already marked attendance for the given date and eventType
    if (
      attendance[userId]?.some(
        (entry) =>
          entry.date === formattedDate && entry.eventType === eventType,
      )
    ) {
      console.warn(
        `Attendance already marked for user ${userId} on ${formattedDate} for ${eventType}.`,
      );
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/attendance/mark`, {
        userId,
        status,
        justified,
        eventType,
      });

      console.log(
        `Attendance marked for user ${userId} for event ${eventType}.`,
      );

      setAttendance((prev) => {
        // const updatedAttendance = prev[userId] ? [...prev[userId]] : [];
        // updatedAttendance.push({
        //   date: formattedDate,
        //   dateTime,
        //   status,
        //   justified,
        //   eventType,
        // });

        return {
          ...prev,
          // [userId]: updatedAttendance,
        };
      });
      setErrorMessage(null); // Clear any error messages
    } catch (error) {
      console.error('Error marking attendance:', error);
      setErrorMessage('There was an issue marking attendance.');
    } finally {
      setLoading(false);
    }
  };

  return { users, attendance, markAttendance, loading, errorMessage };
};
