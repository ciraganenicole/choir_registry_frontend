import { useState } from 'react';

import Layout from '@/components/layout';
import Pagination from '@/components/pagination';

import {
  AttendanceEventType,
  AttendanceStatus,
  JustificationReason,
  useAttendance,
} from './logic';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

interface JustificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (justified: boolean, reason?: JustificationReason) => void;
  status: AttendanceStatus;
}

const JustificationPopup = ({
  isOpen,
  onClose,
  onSave,
  status,
}: JustificationPopupProps) => {
  const [isJustified, setIsJustified] = useState(false);
  const [isNotJustified, setIsNotJustified] = useState(false);
  const [reason, setReason] = useState<JustificationReason | ''>('');

  const handleJustifiedChange = (checked: boolean) => {
    setIsJustified(checked);
    if (checked) {
      setIsNotJustified(false);
    }
  };

  const handleNotJustifiedChange = (checked: boolean) => {
    setIsNotJustified(checked);
    if (checked) {
      setIsJustified(false);
      setReason('');
    }
  };

  const handleSave = () => {
    if (isJustified && reason) {
      onSave(true, reason);
    } else if (isNotJustified) {
      onSave(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {status === AttendanceStatus.LATE
            ? 'Late Attendance'
            : 'Absent Attendance'}
        </h3>
        <div className="mb-4 space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isJustified}
              onChange={(e) => handleJustifiedChange(e.target.checked)}
              className="mr-2"
            />
            Justified
          </label>
          {isJustified && (
            <div className="ml-6">
              <select
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as JustificationReason)
                }
                className="mt-2 w-full rounded-md border p-2"
              >
                <option value="">Select a reason</option>
                {Object.values(JustificationReason).map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isNotJustified}
              onChange={(e) => handleNotJustifiedChange(e.target.checked)}
              className="mr-2"
            />
            Not Justified
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!isJustified || !reason) && !isNotJustified}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

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

const AttendanceTable = () => {
  const {
    users,
    markAttendance,
    filters,
    setFilters,
    exportAttendance,
    attendance,
    loading,
    errorMessage,
  } = useAttendance();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const today = new Date().toISOString().split('T')[0] as string;
  const isToday = (date: string) => date === today;
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    userId: number | null;
    date: string | null;
    status: AttendanceStatus | null;
  }>({
    isOpen: false,
    userId: null,
    date: null,
    status: null,
  });

  log('Attendance Table State:', {
    users: users.length,
    attendance: Object.keys(attendance).length,
    loading,
    errorMessage,
    filters,
  });

  const handleStatusChange = async (
    userId: number,
    date: string,
    newStatus: AttendanceStatus,
  ) => {
    if (
      newStatus === AttendanceStatus.LATE ||
      newStatus === AttendanceStatus.ABSENT
    ) {
      setPopupState({
        isOpen: true,
        userId,
        date,
        status: newStatus,
      });
    } else {
      await markAttendance(userId, {
        date,
        status: newStatus,
        eventType: AttendanceEventType.REHEARSAL,
        timeIn: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  };

  const handleJustificationSave = async (
    justified: boolean,
    reason?: JustificationReason,
  ) => {
    if (!popupState.userId || !popupState.date || !popupState.status) return;

    await markAttendance(popupState.userId, {
      date: popupState.date,
      status: popupState.status,
      eventType: AttendanceEventType.REHEARSAL,
      timeIn: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      justification: justified ? reason : undefined,
    });

    setPopupState({
      isOpen: false,
      userId: null,
      date: null,
      status: null,
    });
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;

    const userAttendance = attendance[user.id] || [];
    log(`User ${user.id} attendance:`, userAttendance);

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

    log(`User ${user.id} matches:`, { matchesStatus, matchesDate });
    return matchesStatus && matchesDate;
  });

  log('Filtered Users:', filteredUsers.length);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const getUserAttendanceForDate = (userId: number, date: string): string => {
    const userAttendance = attendance[userId] || [];
    const attendanceRecord = userAttendance.find((r) => r.date === date);
    log(`Attendance for user ${userId} on ${date}:`, attendanceRecord);
    return attendanceRecord ? attendanceRecord.status.toLowerCase() : '';
  };

  const getStatusEmoji = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return '✅';
      case 'absent':
        return '❌';
      case 'late':
        return '🟡';
      default:
        return '—';
    }
  };

  const getDatesWithAttendance = () => {
    const dates = new Set<string>();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    Object.values(attendance).forEach((records) => {
      if (Array.isArray(records)) {
        records.forEach((record) => {
          if (record?.date) {
            // If filters are set, include all dates that match the filters
            if (filters.startDate || filters.endDate) {
              // Check if the date is within the filter range
              const recordDate = new Date(record.date);
              const startDate = filters.startDate
                ? new Date(filters.startDate)
                : null;
              const endDate = filters.endDate
                ? new Date(filters.endDate)
                : null;

              const isInDateRange =
                (!startDate || recordDate >= startDate) &&
                (!endDate || recordDate <= endDate);

              if (isInDateRange) {
                dates.add(record.date);
              }
            } else {
              // Otherwise, only include dates from the current month
              const recordDate = new Date(record.date);
              if (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear &&
                recordDate <= currentDate
              ) {
                dates.add(record.date);
              }
            }
          }
        });
      }
    });

    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
    log('Dates with attendance:', sortedDates);
    return sortedDates;
  };

  const datesWithAttendance = getDatesWithAttendance();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Attendance Records</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Total Users: {users.length}
            </span>
            <button
              onClick={exportAttendance}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Export
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {loading && (
          <div className="mb-4 text-center text-gray-600">Loading...</div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
          <select
            value={filters.status || 'all'}
            onChange={(e) =>
              setFilters({
                ...filters,
                status:
                  e.target.value === 'all'
                    ? undefined
                    : (e.target.value as AttendanceStatus),
              })
            }
            className="rounded-md border p-2"
          >
            <option value="all">All Status</option>
            {Object.values(AttendanceStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.eventType || 'all'}
            onChange={(e) =>
              setFilters({
                ...filters,
                eventType:
                  e.target.value === 'all'
                    ? undefined
                    : (e.target.value as AttendanceEventType),
              })
            }
            className="rounded-md border p-2"
          >
            <option value="all">All Events</option>
            {Object.values(AttendanceEventType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                startDate: e.target.value,
              })
            }
            className="rounded-md border p-2"
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                endDate: e.target.value,
              })
            }
            className="rounded-md border p-2"
          />
        </div>

        {/* Table */}
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="bg-blue-50 px-2 py-1 text-left text-xs font-medium uppercase tracking-wider text-blue-700">
                  Today
                </th>
                {datesWithAttendance.map((date) => (
                  <th
                    key={date}
                    className={`px-2 py-1 text-left text-xs font-medium uppercase tracking-wider ${
                      isToday(date)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-6 py-2">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap bg-blue-50 p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleStatusChange(
                            user.id,
                            today,
                            AttendanceStatus.PRESENT,
                          )
                        }
                        className="rounded-[5px] bg-green-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-green-600"
                      >
                        Present
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            user.id,
                            today,
                            AttendanceStatus.LATE,
                          )
                        }
                        className="rounded bg-yellow-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-yellow-600"
                      >
                        Retard
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            user.id,
                            today,
                            AttendanceStatus.ABSENT,
                          )
                        }
                        className="rounded bg-red-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-red-600"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  {datesWithAttendance.map((date) => {
                    const currentStatus = getUserAttendanceForDate(
                      user.id,
                      date,
                    );
                    return (
                      <td
                        key={date}
                        className={`whitespace-nowrap p-2 ${
                          isToday(date) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="text-center text-sm">
                          {getStatusEmoji(currentStatus)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Justification Popup */}
        <JustificationPopup
          isOpen={popupState.isOpen}
          onClose={() =>
            setPopupState({
              isOpen: false,
              userId: null,
              date: null,
              status: null,
            })
          }
          onSave={handleJustificationSave}
          status={popupState.status || AttendanceStatus.LATE}
        />
      </div>
    </Layout>
  );
};

export default AttendanceTable;
