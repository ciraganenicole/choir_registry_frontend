import axios from 'axios';
import { useEffect, useState } from 'react';

// Define the structure for a user and attendance
interface User {
  id: number;
  name: string;
}

interface Attendance {
  [userId: number]: string[]; // userId maps to an array of days
}

export const fetchAttendance = async (userId: number) => {
  try {
    const response = await axios.get(
      `http://localhost:4000/attendance/${userId}`,
    );
    const { data } = response;

    const attendedDays = data.map((entry: { date: string }) => {
      const dateObj = new Date(entry.date);
      return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return { [userId]: attendedDays };
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return {};
  }
};

export const useAttendance = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({});
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:4000/users');
      setUsers(response.data);

      // Fetch all users' attendance concurrently
      const userAttendancePromises = response.data.map((user: User) =>
        fetchAttendance(user.id),
      );
      const attendanceDataArray = await Promise.all(userAttendancePromises);

      // Combine all user attendance into a single object
      const attendanceData: Attendance = response.data.reduce(
        (acc: Attendance, user: User, index: number) => {
          acc[user.id] = attendanceDataArray[index][user.id];
          return acc;
        },
        {},
      );

      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const markAttendance = async (userId: number, credential: any) => {
    if (!credential) {
      console.error('Credential is missing or invalid');
      return;
    }
    setLoading(true);
    try {
      // Send both userId and credential to the backend API
      await axios.post('http://localhost:4000/attendance/mark', {
        userId,
        credential,
      });

      // Fetch the updated attendance for the user
      const userAttendance = await fetchAttendance(userId);

      setAttendance((prevState) => ({
        ...prevState,
        [userId]: userAttendance[userId],
      }));
    } catch (error) {
      console.error('Error marking attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  return { users, attendance, markAttendance, loading };
};
