import { useEffect, useRef, useState } from 'react';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';

import { AttendanceStatus, EventType, useAttendance } from './logic';

export interface AttendanceRecord {
  date: string;
  dateTime: string;
  status: AttendanceStatus;
  justified: boolean;
  eventType: EventType;
}

const AttendanceTable = () => {
  const { users, attendance, markAttendance } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const today = new Date().toISOString().split('T')[0]!;

  const attendanceStartTimeRef = useRef<Date | null>(null);

  const getWeekDates = () => {
    const theday = new Date();
    const dayOfWeek = theday.getDay();
    const monday = new Date(today);
    monday.setDate(theday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date: date.toISOString().split('T')[0] ?? '',
        day: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      };
    });
  };

  const weekDates = getWeekDates();

  const filteredUsers = users.filter((user) => {
    const isOnLeaveToday =
      Array.isArray(user.leaves) &&
      user.leaves.some((leave) => {
        const leaveStart = new Date(leave.startDate)
          .toISOString()
          .split('T')[0];
        const leaveEnd = leave.endDate
          ? new Date(leave.endDate).toISOString().split('T')[0]
          : null;
        return (
          leaveStart && (!leaveEnd || today <= leaveEnd) && today >= leaveStart
        );
      });

    const matchesSearchQuery =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.surname.toLowerCase().includes(searchQuery.toLowerCase());

    return !isOnLeaveToday && matchesSearchQuery;
  });

  const sortedUsers = filteredUsers.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {}, [attendance]);

  const getUserAttendanceForDate = (userId: number, date: string): string => {
    if (new Date(date) > new Date(today)) return '';

    const records = attendance[userId];
    if (!records || records.length === 0) {
      return '—';
    }

    const record = records.find((entry) => entry.date === date);

    if (!record) return '—';

    const status = record.status.toLowerCase();

    switch (status) {
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

  const handleStartAttendance = (startTime: Date) => {
    if (!attendanceStartTimeRef.current) {
      attendanceStartTimeRef.current = startTime;
      console.log('Attendance started at:', startTime.toISOString());
    }
  };

  const handleMarkAttendance = async (
    userId: number,
    buttonTime: Date,
  ): Promise<void> => {
    if (!attendanceStartTimeRef.current) {
      console.warn('Attendance has not started.');
      return; // Ensure a return here
    }

    const now = new Date();
    if (today !== now.toISOString().split('T')[0]) {
      console.log('');
      return; // Return to satisfy the linter
    }

    const timeElapsed =
      (buttonTime.getTime() - attendanceStartTimeRef.current.getTime()) / 60000;
    let status: AttendanceStatus = AttendanceStatus.PRESENT;

    if (timeElapsed > 2 && timeElapsed <= 4) status = AttendanceStatus.LATE;
    else if (timeElapsed > 4) status = AttendanceStatus.ABSENT;

    const dateTime = now.toISOString();
    const record: AttendanceRecord = {
      date: today,
      dateTime,
      status,
      justified: false,
      eventType: EventType.NORMAL,
    };

    try {
      await markAttendance(userId, record);
      console.log(`Attendance marked: User ${userId} - ${status}`);
      // Explicitly return to resolve the async function
    } catch (error) {
      console.error('Error marking attendance:', error);
      // Ensure we return after catching an error
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between py-4">
          <h2 className="text-2xl font-semibold">Registre</h2>
          <div className="flex flex-row gap-4">
            <SearchInput onSearch={setSearchQuery} />
          </div>
        </div>

        <div className="mb-4 rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm">
          {/* Table for large screens */}
          <div className="hidden lg:block">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-400">
                  <th className="rounded-tl-md px-4 py-2">N</th>
                  <th className="px-4 py-2">Noms</th>
                  <th className="px-4 py-2">Prénoms</th>
                  {weekDates.map((item, index) => (
                    <th
                      key={item.date}
                      className={`p-2 ${item.date === today ? 'bg-yellow-200' : ''} ${index === weekDates.length - 1 ? 'rounded-tr-md' : ''}`}
                    >
                      {item.day.charAt(0).toUpperCase() + item.day.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, index) => (
                  <tr key={user.id} className="border border-gray-500">
                    <td className="border border-gray-500 px-4 py-3">
                      {indexOfFirstUser + index + 1}
                    </td>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.surname}</td>
                    {weekDates.map((item) => (
                      <td
                        key={item.date}
                        className="border border-gray-500 p-2"
                      >
                        {item.day.toLowerCase() === 'dimanche' ||
                        item.date !== today ? (
                          getUserAttendanceForDate(user.id, item.date)
                        ) : (
                          <button
                            className="rounded bg-blue-500 px-2 py-1 text-white"
                            onClick={() => {
                              if (!attendanceStartTimeRef.current) {
                                handleStartAttendance(new Date());
                              }
                              handleMarkAttendance(user.id, new Date());
                            }}
                          >
                            Mark
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for small screens */}
        </div>

        <div className="lg:hidden">
          {currentUsers.map((user) => (
            <div
              key={user.id}
              className="mb-4 rounded-md bg-white p-4 shadow-md"
            >
              <h3 className="font-semibold">
                {user.name} {user.surname}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDates.map((item) => (
                  <div key={item.date} className="flex flex-col items-center">
                    {/* <div>{item.day.charAt(0).toUpperCase() + item.day.slice(1)}</div> */}
                    {item.day.toLowerCase() === 'dimanche' ||
                    item.date !== today ? (
                      <div>{getUserAttendanceForDate(user.id, item.date)}</div>
                    ) : (
                      <button
                        className="ml-2 rounded bg-blue-500 px-2 py-1 text-white"
                        onClick={() => {
                          if (!attendanceStartTimeRef.current) {
                            handleStartAttendance(new Date());
                          }
                          handleMarkAttendance(user.id, new Date());
                        }}
                      >
                        Mark
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </Layout>
  );
};

export default AttendanceTable;
