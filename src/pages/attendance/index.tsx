// eslint-disable-next-line import/no-extraneous-dependencies
import { format, parseISO } from 'date-fns';
import debounce from 'lodash/debounce';
import { useCallback, useState } from 'react';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import { api } from '@/config/api';
import { EventTypeSelector } from '@/lib/attendance/EventTypeSelector';
import {
  AttendanceEventType,
  AttendanceStatus,
  JustificationReason,
  useAttendance,
} from '@/lib/attendance/logic';
import { JustificationReasonLabels } from '@/lib/attendance/types';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return format(parseISO(dateString), 'dd/MM/yyyy');
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

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Selected justification reason:', e.target.value);
    setReason(e.target.value as JustificationReason);
  };

  const handleSave = () => {
    console.log(
      'Saving justification. isJustified:',
      isJustified,
      'reason:',
      reason,
      'isNotJustified:',
      isNotJustified,
    );
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
          {status === AttendanceStatus.LATE ? 'Retard' : 'Absence'}
        </h3>
        <div className="mb-4 space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isJustified}
              onChange={(e) => handleJustifiedChange(e.target.checked)}
              className="mr-2"
            />
            Justifie(é)
          </label>
          {isJustified && (
            <div className="ml-1 md:ml-6">
              <select
                value={reason}
                onChange={handleReasonChange}
                className="mt-2 w-full rounded-md border p-2"
              >
                <option value="">Raison</option>
                {Object.values(JustificationReason).map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="text-[12px] md:text-[16px]"
                  >
                    {JustificationReasonLabels[r as JustificationReason]}
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
            Non Justifie(é)
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={(!isJustified || !reason) && !isNotJustified}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            Enregistrer
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
    setAttendance,
  } = useAttendance();

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Initialize with today's date in local timezone
  const getTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
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

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value || getTodayDate();
    setSelectedDate(inputDate);

    // Check if we have any records for this date
    const hasRecordsForDate = Object.values(attendance).some(
      (records) =>
        Array.isArray(records) &&
        records.some(
          (r) => r.date === inputDate && r.eventType === selectedEventType,
        ),
    );

    // If no records exist for this date, initialize all users as absent
    if (!hasRecordsForDate) {
      try {
        // Call backend to initialize all users as absent
        await api.post('/attendance/initialize', {
          date: inputDate,
          eventType: selectedEventType,
          status: AttendanceStatus.ABSENT,
        });

        // Update local state to reflect all users as absent
        const updatedAttendance = { ...attendance };
        filteredUsers.forEach((user) => {
          updatedAttendance[user.id] = [
            ...(updatedAttendance[user.id] || []),
            {
              userId: user.id,
              date: inputDate,
              status: AttendanceStatus.ABSENT,
              eventType: selectedEventType,
              timeIn: new Date().toLocaleTimeString('fr-FR', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ];
        });
        setAttendance(updatedAttendance);
      } catch (error) {
        console.error('Error initializing attendance:', error);
      }
    }
  };

  const handleStatusChange = async (
    userId: number,
    newStatus: AttendanceStatus,
  ) => {
    // Normalize the date to YYYY-MM-DD format
    const dateToUse = new Date(selectedDate).toISOString().split('T')[0];

    if (
      newStatus === AttendanceStatus.LATE ||
      newStatus === AttendanceStatus.ABSENT
    ) {
      setPopupState({
        isOpen: true,
        userId,
        date: dateToUse || null,
        status: newStatus,
      });
    } else {
      try {
        const updatedRecord = await markAttendance(userId, {
          date: dateToUse,
          status: newStatus,
          eventType: selectedEventType,
          timeIn: new Date().toLocaleTimeString('fr-FR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        // Update only the affected user's attendance in state
        setAttendance((prev) => ({
          ...prev,
          [userId]: [
            // Remove any record for the same date/eventType, then add the new one
            ...(prev[userId] || []).filter(
              (r) =>
                !(r.date === dateToUse && r.eventType === selectedEventType),
            ),
            updatedRecord,
          ],
        }));
      } catch (error) {
        console.error('Error marking attendance:', error);
      }
    }
  };

  const handleJustificationSave = async (
    _justified: boolean,
    reason?: JustificationReason,
  ) => {
    console.log('handleJustificationSave called with reason:', reason);
    if (!popupState.userId || !popupState.date || !popupState.status) return;

    // Normalize the date to YYYY-MM-DD format
    const dateToUse = new Date(popupState.date).toISOString().split('T')[0];
    const attendanceData = {
      userId: popupState.userId,
      date: dateToUse,
      status: popupState.status,
      eventType: selectedEventType,
      timeIn: new Date().toLocaleTimeString('fr-FR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      justification: reason,
    };
    console.log('Sending attendanceData to backend:', attendanceData);

    try {
      const updatedRecord = await markAttendance(
        popupState.userId,
        attendanceData,
      );
      // Update only the affected user's attendance in state
      setAttendance((prev) => ({
        ...prev,
        [popupState.userId!]: [
          // Remove any record for the same date/eventType, then add the new one
          ...(prev[popupState.userId!] || []).filter(
            (r) =>
              !(
                r.date === attendanceData.date &&
                r.eventType === attendanceData.eventType
              ),
          ),
          updatedRecord,
        ],
      }));
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
  ): { status: string | null; hasJustification: boolean } => {
    const userAttendance = attendance[userId] || [];
    // Normalize both dates to YYYY-MM-DD format for comparison
    const normalizedSearchDate = new Date(date).toISOString().split('T')[0];
    const attendanceRecord = userAttendance.find((r) => {
      const normalizedRecordDate = new Date(r.date).toISOString().split('T')[0];
      return (
        normalizedRecordDate === normalizedSearchDate &&
        r.eventType === selectedEventType
      );
    });
    return {
      status: attendanceRecord ? attendanceRecord.status : null,
      hasJustification: !!attendanceRecord?.justification,
    };
  };

  const getStatusEmoji = (
    status: string | null,
    hasJustification: boolean,
    isActive: boolean,
  ) => {
    if (!isActive) return '—'; // Inactive user
    let emoji = '';
    switch ((status || '').toUpperCase()) {
      case 'PRESENT':
        emoji = '✅';
        break;
      case 'ABSENT':
        emoji = '❌';
        break;
      case 'LATE':
        emoji = '🟡';
        break;
      case '':
      case null:
      default:
        emoji = '❌'; // Default for active user with no record
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
            // Defensive date parsing to avoid timezone issues
            const recordDate = new Date(`${record.date}T00:00:00`);
            if (filters.startDate || filters.endDate) {
              const startDate = filters.startDate
                ? new Date(`${filters.startDate}T00:00:00`)
                : null;
              const endDate = filters.endDate
                ? new Date(`${filters.endDate}T00:00:00`)
                : null;
              const isInDateRange =
                (!startDate || recordDate >= startDate) &&
                (!endDate || recordDate <= endDate);
              if (isInDateRange) {
                dates.add(record.date);
              }
            } else if (
              recordDate.getMonth() === currentMonth &&
              recordDate.getFullYear() === currentYear
            ) {
              dates.add(record.date);
            }
          }
        });
      }
    });
    const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
    return sortedDates;
  };

  let datesWithAttendance = getDatesWithAttendance();

  // Only include dates that have at least one attendance record for the selected event type
  datesWithAttendance = datesWithAttendance.filter((date) =>
    Object.values(attendance).some(
      (records) =>
        Array.isArray(records) &&
        records.some(
          (r) => r.date === date && r.eventType === selectedEventType,
        ),
    ),
  );

  if (selectedDate && !datesWithAttendance.includes(selectedDate)) {
    datesWithAttendance = [selectedDate, ...datesWithAttendance];
  }
  datesWithAttendance = datesWithAttendance.sort((a, b) => b.localeCompare(a));

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
      <div className="container mx-auto p-4 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[16px] font-bold md:text-2xl">Présences</h1>
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
        <div className="mb-4 flex flex-wrap gap-[2px] md:gap-4">
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

        {/* Event Type Header and Date Selector */}
        <div className="mb-4 mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-row items-center gap-2 md:gap-8">
            <div className="w-[50%] md:w-auto">
              <h2 className="text-[14px] font-semibold text-gray-800 md:text-[24px]">
                {selectedEventType === AttendanceEventType.REHEARSAL &&
                  'Liste des Membres'}
                {selectedEventType === AttendanceEventType.SUNDAY_SERVICE &&
                  'Liste des Membres - Culte Dominical'}
                {selectedEventType === AttendanceEventType.LOUADO &&
                  'Liste des Membres - Louado'}
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
            <div className="w-[50%] md:w-auto">
              <SearchInput onSearch={handleSearch} />
            </div>
          </div>

          {/* Manual Date Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-gray-700 md:text-[14px]">
              Date de présence:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="rounded-md border p-1 text-[12px] md:p-2 md:text-[14px]"
            />
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
                      {user.lastName} {user.firstName}
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
                                  true,
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
                    {(() => {
                      const attendanceRecord = getUserAttendanceForDate(
                        user.id,
                        selectedDate,
                      );
                      const statusSet = !!attendanceRecord.status;
                      return (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                AttendanceStatus.PRESENT,
                              )
                            }
                            className={`rounded-[5px] bg-green-500 px-3 py-1 text-[12px] text-white hover:bg-green-600${
                              statusSet &&
                              attendanceRecord.status !==
                                AttendanceStatus.PRESENT
                                ? ' opacity-50'
                                : ''
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(user.id, AttendanceStatus.LATE)
                            }
                            className={`rounded bg-yellow-500 px-3 py-1 text-[12px] text-white hover:bg-yellow-600${
                              statusSet &&
                              attendanceRecord.status !== AttendanceStatus.LATE
                                ? ' opacity-50'
                                : ''
                            }`}
                          >
                            Retard
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                AttendanceStatus.ABSENT,
                              )
                            }
                            className={`rounded bg-red-500 px-3 py-1 text-[12px] text-white hover:bg-red-600${
                              statusSet &&
                              attendanceRecord.status !==
                                AttendanceStatus.ABSENT
                                ? ' opacity-50'
                                : ''
                            }`}
                          >
                            Absent
                          </button>
                        </>
                      );
                    })()}
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
                        className="px-2 py-1 text-left text-xs font-medium uppercase tracking-wider"
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
                          {user.lastName} {user.firstName}
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
                          {(() => {
                            const attendanceRecord = getUserAttendanceForDate(
                              user.id,
                              selectedDate,
                            );
                            const statusSet = !!attendanceRecord.status;
                            return (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      user.id,
                                      AttendanceStatus.PRESENT,
                                    )
                                  }
                                  className={`rounded-[5px] bg-green-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-green-600${
                                    statusSet &&
                                    attendanceRecord.status !==
                                      AttendanceStatus.PRESENT
                                      ? ' opacity-50'
                                      : ''
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      user.id,
                                      AttendanceStatus.LATE,
                                    )
                                  }
                                  className={`rounded bg-yellow-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-yellow-600${
                                    statusSet &&
                                    attendanceRecord.status !==
                                      AttendanceStatus.LATE
                                      ? ' opacity-50'
                                      : ''
                                  }`}
                                >
                                  Retard
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      user.id,
                                      AttendanceStatus.ABSENT,
                                    )
                                  }
                                  className={`rounded bg-red-500 px-[4px] py-[1px] text-[10px] text-white hover:bg-red-600${
                                    statusSet &&
                                    attendanceRecord.status !==
                                      AttendanceStatus.ABSENT
                                      ? ' opacity-50'
                                      : ''
                                  }`}
                                >
                                  Absent
                                </button>
                              </>
                            );
                          })()}
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
                                true,
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
