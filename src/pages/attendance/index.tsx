// eslint-disable-next-line import/no-extraneous-dependencies
import debounce from 'lodash/debounce';
import { useCallback, useState } from 'react';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import { EventTypeSelector } from '@/lib/attendance/EventTypeSelector';
import {
  AttendanceEventType,
  AttendanceStatus,
  JustificationReason,
  useAttendance,
} from '@/lib/attendance/logic';

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
      onSave(true, reason as JustificationReason);
    } else if (isNotJustified) {
      onSave(false, undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[80%] rounded-lg bg-white p-6 md:w-96">
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
            <div className="ml-1 md:ml-6">
              <select
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as JustificationReason)
                }
                className="mt-2 w-full rounded-md border p-2"
              >
                <option value="">Select a reason</option>
                {Object.values(JustificationReason).map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="text-[12px] md:text-[16px]"
                  >
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

const AttendancePage: React.FC = () => {
  const {
    markAttendance,
    filters,
    setFilters,
    exportAttendanceToPDF,
    attendance,
    loading,
    errorMessage,
    selectedEventType,
    changeEventType,
    filteredUsers,
    fetchUsersAndAttendance,
  } = useAttendance();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const today = new Date().toISOString().split('T')[0] as string;
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
      try {
        await markAttendance(userId, {
          date,
          status: newStatus,
          eventType: selectedEventType,
          timeIn: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        await fetchUsersAndAttendance();
      } catch (error) {
        console.error('Error marking attendance:', error);
      }
    }
  };

  const handleJustificationSave = async (
    _justified: boolean,
    reason?: JustificationReason,
  ) => {
    if (!popupState.userId || !popupState.date || !popupState.status) return;

    const attendanceData = {
      userId: popupState.userId,
      date: popupState.date,
      status: popupState.status,
      eventType: selectedEventType,
      timeIn: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      justification: reason,
    };

    try {
      await markAttendance(popupState.userId, attendanceData);
      await fetchUsersAndAttendance();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }

    setPopupState({
      isOpen: false,
      userId: null,
      date: null,
      status: null,
    });
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const getUserAttendanceForDate = (
    userId: number,
    date: string,
  ): { status: string; hasJustification: boolean } => {
    const userAttendance = attendance[userId] || [];
    const attendanceRecord = userAttendance.find(
      (r) => r.date === date && r.eventType === selectedEventType,
    );
    return {
      status: attendanceRecord ? attendanceRecord.status.toLowerCase() : '',
      hasJustification: !!attendanceRecord?.justification,
    };
  };

  const getStatusEmoji = (status: string, hasJustification: boolean) => {
    let emoji = '';
    switch (status.toLowerCase()) {
      case 'present':
        emoji = '✅';
        break;
      case 'absent':
        emoji = '❌';
        break;
      case 'late':
        emoji = '🟡';
        break;
      default:
        emoji = '—';
    }
    return hasJustification ? `${emoji}J` : emoji;
  };

  const getDatesWithAttendance = () => {
    const dates = new Set<string>();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    Object.values(attendance).forEach((records) => {
      if (Array.isArray(records)) {
        records.forEach((record) => {
          if (record?.date && record.eventType === selectedEventType) {
            if (filters.startDate || filters.endDate) {
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
    return sortedDates;
  };

  const datesWithAttendance = getDatesWithAttendance();

  // Create a debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setFilters((prevFilters) => ({
        ...prevFilters,
        search: searchTerm,
      }));
    }, 300), // Wait 300ms after user stops typing
    [],
  );

  const handleSearch = (searchTerm: string) => {
    // Update UI immediately but debounce the actual filter update
    debouncedSearch(searchTerm);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[16px] font-bold md:text-2xl">
            Attendance Records
          </h1>
          <button
            onClick={(e) => {
              e.preventDefault();
              exportAttendanceToPDF(filters);
            }}
            className="rounded-md bg-blue-500 px-2 py-1 text-[12px] text-white hover:bg-blue-600 md:px-4 md:py-2 md:text-[16px]"
          >
            Export PDF
          </button>
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
        <div className="mb-4 flex gap-[2px] md:gap-4">
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
            className="rounded-md border p-1 text-[10px] md:p-2 md:text-[14px]"
          >
            <option value="all">Tous</option>
            {Object.values(AttendanceStatus).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
            className="rounded-md border p-1 text-[10px] md:p-2 md:text-[14px]"
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
            className="rounded-md border p-1 text-[10px] md:p-2 md:text-[14px]"
          />
        </div>

        {/* Event Type Selector */}
        <EventTypeSelector
          selectedEventType={selectedEventType}
          onEventTypeChange={changeEventType}
        />

        {/* Event Type Header */}
        <div className="mb-4 mt-6 flex flex-row items-center gap-2 md:gap-8">
          <div className="mb-4 mt-6 w-[50%] md:w-[20%]">
            <h2 className="text-[14px] font-semibold text-gray-800 md:text-[24px]">
              {selectedEventType === AttendanceEventType.REHEARSAL &&
                'Liste des Choristes'}
              {selectedEventType === AttendanceEventType.SUNDAY_SERVICE &&
                'Liste des Choristes - Culte Dominical'}
              {selectedEventType === AttendanceEventType.LOUADO &&
                'Liste des Choristes - Louado'}
              {selectedEventType === AttendanceEventType.MUSIC &&
                'Liste des Musiciens'}
              {selectedEventType === AttendanceEventType.COMMITTEE &&
                'Liste des Membres du Comité'}
            </h2>
            <p className="mt-1 text-[10px] text-gray-600 md:text-sm">
              {filteredUsers.length} membre
              {filteredUsers.length !== 1 ? 's' : ''} trouvé
              {filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-[50%] md:w-[20%]">
            <SearchInput onSearch={handleSearch} />
          </div>
        </div>

        {/* Table */}
        {filteredUsers.length === 0 ? (
          <div className="mt-4 rounded-md bg-gray-50 p-4 text-center text-gray-600">
            Aucun membre trouvé pour ce type d&apos;événement
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-col gap-4 md:hidden">
              {currentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col rounded-[10px] border-[1px] border-gray-500 shadow-md"
                >
                  <div className="p-2">
                    <h2 className="mb-4 text-[18px] font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h2>
                    <div className="grid grid-cols-2">
                      {datesWithAttendance.map((date) => {
                        const attendanceRecord = getUserAttendanceForDate(
                          user.id,
                          date,
                        );
                        return (
                          <div key={date}>
                            <div className="flex flex-row items-center gap-2">
                              <span className="text-[12px] font-semibold text-gray-900/80">
                                {formatDate(date)} :
                              </span>
                              <span>
                                {getStatusEmoji(
                                  attendanceRecord.status,
                                  attendanceRecord.hasJustification,
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-gray-900/40" />
                  <div className="flex flex-row items-center gap-4 p-2">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          user.id,
                          today,
                          AttendanceStatus.PRESENT,
                        )
                      }
                      className="rounded-[5px] bg-green-500 px-3 py-1 text-[12px] text-white hover:bg-green-600"
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
                      className="rounded bg-yellow-500 px-3 py-1 text-[12px] text-white hover:bg-yellow-600"
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
                      className="rounded bg-red-500 px-3 py-1 text-[12px] text-white hover:bg-red-600"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-4 hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="bg-blue-50 px-2 py-1 text-left text-xs font-medium uppercase tracking-wider text-blue-700">
                      Actions
                    </th>
                    {datesWithAttendance.map((date) => (
                      <th
                        key={date}
                        className="px-2 py-1 text-left text-xs font-medium uppercase tracking-wider "
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
                        <div className="text-xs text-gray-500">
                          {user.commissions
                            .map((commission) =>
                              commission
                                .toLowerCase()
                                .split('_')
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(' '),
                            )
                            .join(', ')}
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
                        const attendanceRecord = getUserAttendanceForDate(
                          user.id,
                          date,
                        );
                        return (
                          <td key={date}>
                            <div className="ml-2 text-left text-sm">
                              {getStatusEmoji(
                                attendanceRecord.status,
                                attendanceRecord.hasJustification,
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

export default AttendancePage;
