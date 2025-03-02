// useLeave.ts
import axios from 'axios';
import { useEffect, useState } from 'react';

import type { User } from '../admin/users/type'; // Adjust path if necessary

interface LeaveRecord {
  startDate: string;
  leaveType: string;
  endDate: string | null;
}

interface Leave {
  [userId: number]: LeaveRecord[];
}

const API_BASE_URL = 'http://localhost:4000'; // Change this if needed

// Fetch a user's leave records
const fetchLeave = async (userId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leave/${userId}`);
    return { [userId]: response.data || [] };
  } catch (error) {
    console.error(`Error fetching leave records for user ${userId}:`, error);
    return { [userId]: [] };
  }
};

export const useLeave = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<Leave>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch all users and their leave records
  const fetchUsersLeave = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      const usersData = response.data;
      setUsers(usersData);

      // Fetch leave records for all users concurrently
      const leaveResults = await Promise.all(
        usersData.map((user: User) => fetchLeave(user.id)),
      );

      // Merge leave results into a single object
      const formattedLeave: Leave = leaveResults.reduce(
        (acc, userLeave) => ({ ...acc, ...userLeave }),
        {},
      );

      setLeaveRecords(formattedLeave);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users and leave records when the component mounts
  useEffect(() => {
    fetchUsersLeave();
  }, []); // This effect runs only once on mount

  // Check if a user is on leave on a given date
  const isUserOnLeave = (userId: number, date?: string) => {
    const checkDate = (date ||
      new Date().toISOString().split('T')[0]) as string;
    if (!Array.isArray(leaveRecords[userId])) return false; // Ensure it's an array

    return leaveRecords[userId]?.some((leave) => {
      const leaveStart = leave.startDate
        ? new Date(leave.startDate).toISOString().split('T')[0]
        : '';
      const leaveEnd = leave.endDate
        ? new Date(leave.endDate).toISOString().split('T')[0]
        : '';
      return (
        leaveStart &&
        leaveEnd &&
        checkDate >= leaveStart &&
        checkDate <= leaveEnd
      );
    });
  };

  // Mark leave for a user
  const markLeave = async (userId: number, leaveData: LeaveRecord) => {
    if (!leaveData) {
      console.error('Leave data is missing or invalid');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/leave/record`, {
        userId,
        ...leaveData,
      });

      console.log('Leave marked successfully for user:', userId);

      // Fetch updated leave records for this user only
      const updatedLeave = await fetchLeave(userId);

      setLeaveRecords((prevState) => ({
        ...prevState,
        ...updatedLeave,
      }));
    } catch (error) {
      console.error('Error marking leave:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    leaveRecords,
    markLeave,
    isUserOnLeave,
    fetchUsersLeave,
    loading,
  };
};
