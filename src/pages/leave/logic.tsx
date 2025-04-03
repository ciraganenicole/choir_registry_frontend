// useLeave.ts
import axios from 'axios';
import { useEffect, useState } from 'react';

import { log, logError } from '@/utils/logger';

import type { User } from '../admin/users/type';

interface LeaveRecord {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  user: User;
}

interface Leave {
  [userId: number]: LeaveRecord[];
}

const API_BASE_URL = 'http://localhost:4000';

// Fetch a user's leave records
const fetchLeave = async (userId: number): Promise<LeaveRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leave/user/${userId}`);

    // Check if the response has the expected structure
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    logError('Error fetching leave records', error);
    return [];
  }
};

export const useLeave = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<Leave>({});
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUsersLeave = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);

      const usersData = response.data.data || [];
      setUsers(usersData);
      const leaveResults = await Promise.all(
        usersData.map((user: User) => fetchLeave(user.id)),
      );

      const mergedLeaves: Leave = {};
      usersData.forEach((user: User, index: number) => {
        const userLeaves = leaveResults[index];
        if (Array.isArray(userLeaves) && userLeaves.length > 0) {
          mergedLeaves[user.id] = userLeaves;
        }
      });

      setLeaveRecords(mergedLeaves);
    } catch (error) {
      console.error('Error fetching users or leave records:', error);
      setUsers([]);
      setLeaveRecords({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch users and leave records when the component mounts
  useEffect(() => {
    fetchUsersLeave();
  }, []);

  // Check if a user is on leave on a given date
  const isUserOnLeave = (userId: number, date?: string): boolean => {
    const checkDate = date ? new Date(date) : new Date();
    const userLeaveRecords = leaveRecords[userId] || [];

    return userLeaveRecords.some((leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const isWithinLeavePeriod =
        checkDate >= leaveStart && checkDate <= leaveEnd;
      return isWithinLeavePeriod;
    });
  };

  // Mark leave for a user
  const markLeave = async (
    userId: number,
    leaveData: Omit<LeaveRecord, 'id' | 'user'>,
  ): Promise<LeaveRecord | null> => {
    if (!leaveData) {
      logError('Leave data is missing or invalid');
      return null;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/leave/user/${userId}`,
        leaveData,
      );

      if (response.data?.success && response.data?.data) {
        // Update local state
        const newLeaveRecord = response.data.data;
        setLeaveRecords((prev) => ({
          ...prev,
          [userId]: [...(prev[userId] || []), newLeaveRecord],
        }));
        return newLeaveRecord;
      }
      return null;
    } catch (error) {
      logError('Error marking leave', error);
      return null;
    }
  };

  // Fetch leave records for all users
  const fetchAllLeaveRecords = async (): Promise<Leave> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leave`);
      log('Leave records response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        const recordsByUser: Leave = {};
        response.data.forEach((record: LeaveRecord) => {
          const userId = record.user.id;
          if (!recordsByUser[userId]) {
            recordsByUser[userId] = [];
          }
          (recordsByUser[userId] as LeaveRecord[]).push(record);
        });
        setLeaveRecords(recordsByUser);
        return recordsByUser;
      }
      return {};
    } catch (error) {
      logError('Error fetching all leave records', error);
      return {};
    }
  };

  return {
    users,
    leaveRecords,
    markLeave,
    isUserOnLeave,
    fetchUsersLeave,
    loading,
    fetchAllLeaveRecords,
  };
};
