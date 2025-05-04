import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Pagination from '@/components/pagination';
import Popup from '@/components/popup';
import { api } from '@/config/api';
import type {
  AttendanceRecord,
  AttendanceStatus,
  JustificationReason,
} from '@/lib/attendance/logic';
import type { User } from '@/lib/user/type';
import { setAttendanceRecords } from '@/store';

interface UserAttendanceDetailsProps {
  user: User;
  onClose: () => void;
}

interface AttendanceFilterDto {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export const UserAttendanceDetails: React.FC<UserAttendanceDetailsProps> = ({
  user,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [filters, setFilters] = useState<AttendanceFilterDto>({
    page: 1,
    limit: 1000,
  });

  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const getCurrentRecords = () => {
    return attendance.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status) queryParams.append('status', filters.status);

      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', '1000');

      const response = await api.get(
        `/attendance/user/${user.id}?${queryParams.toString()}`,
      );

      const responseData = response.data;
      const records = responseData[0] || [];

      const sortedRecords = records.sort(
        (a: AttendanceRecord, b: AttendanceRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setAttendance(sortedRecords);
      dispatch(
        setAttendanceRecords({ userId: user.id, records: sortedRecords }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters.startDate, filters.endDate, filters.status]);

  const handleFilterChange = (newFilters: Partial<AttendanceFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'text-green-600';
      case 'LATE':
        return 'text-yellow-600';
      case 'ABSENT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Translate status to French
  const translateStatus = (status: AttendanceStatus): string => {
    const translations: Record<string, string> = {
      PRESENT: 'Présent',
      LATE: 'En retard',
      ABSENT: 'Absent',
    };
    return translations[status] || status;
  };

  // Translate event type to French
  const translateEventType = (type: string): string => {
    const translations: Record<string, string> = {
      REHEARSAL: 'Répétition',
      SUNDAY_SERVICE: 'Culte',
      LOUADO: 'Louado',
      MUSIC: 'Musique',
      COMMITTEE: 'Comité',
    };
    return translations[type] || type;
  };

  const getStatusDisplay = (
    status: AttendanceStatus,
    justification?: JustificationReason,
  ) => {
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

    return (
      <div className="flex items-center gap-2">
        <span>{emoji}</span>
        <span className={getStatusColor(status)}>
          {translateStatus(status)}
        </span>
        {justification && (
          <span className="text-md font-semibold text-gray-900">( J )</span>
        )}
      </div>
    );
  };

  return (
    <Popup
      title={`Présences - ${user.firstName} ${user.lastName}`}
      onClose={onClose}
      style="md:w-[70%]"
    >
      <div className="flex flex-col gap-2">
        {/* Filters */}
        <div className="flex flex-wrap gap-1 md:gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Date de début
            </label>
            <input
              type="date"
              className="rounded-md border border-gray-300 p-1 text-xs md:px-3 md:py-2 md:text-sm"
              value={filters.startDate || ''}
              onChange={(e) =>
                handleFilterChange({ startDate: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Date de fin
            </label>
            <input
              type="date"
              className="rounded-md border border-gray-300 p-1 text-xs md:px-3 md:py-2 md:text-sm"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700 md:text-sm">
              Statut
            </label>
            <select
              className="rounded-md border border-gray-300 p-1 text-xs md:px-3 md:py-2 md:text-sm"
              value={filters.status || ''}
              onChange={(e) =>
                handleFilterChange({
                  status: (e.target.value || undefined) as AttendanceStatus,
                })
              }
            >
              <option value="">Tous</option>
              <option value="PRESENT">Présent</option>
              <option value="LATE">En retard</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            Une erreur s&apos;est produite lors du chargement des données.
            Veuillez réessayer.
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {!loading && attendance?.length > 0 && (
          <div className="mt-2 flex flex-col gap-3 md:hidden">
            <div className="flex flex-col gap-3 rounded-md border border-gray-500">
              {getCurrentRecords().map((record) => (
                <div
                  key={`${record.id}`}
                  className="grid grid-cols-2 gap-2 border-b border-gray-500 p-2"
                >
                  <p className="text-sm">{formatDate(record.date)}</p>
                  <p className="text-sm">
                    {translateEventType(record.eventType)}
                  </p>
                  <p className="text-sm">
                    {getStatusDisplay(record.status, record.justification)}
                  </p>
                  <p className="text-sm">{record.timeIn || '-'}</p>
                </div>
              ))}
            </div>
            <Pagination
              totalPages={Math.ceil(attendance.length / recordsPerPage)}
              currentPage={currentPage}
              onPageChange={(page) => {
                setCurrentPage(page);
              }}
            />
          </div>
        )}

        {/* Attendance table */}
        {!loading && attendance?.length > 0 && (
          <div className="hidden flex-col gap-3 md:flex">
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Type d&apos;événement
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Statut
                    </th>
                    <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Heure d&apos;arrivée
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {getCurrentRecords().map((record) => (
                    <tr key={`${record.id}`}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {formatDate(record.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {translateEventType(record.eventType)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {getStatusDisplay(record.status, record.justification)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {record.timeIn || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="">
              <Pagination
                totalPages={Math.ceil(attendance.length / recordsPerPage)}
                currentPage={currentPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                }}
              />
            </div>
          </div>
        )}

        {/* No data state */}
        {!loading && attendance?.length === 0 && (
          <div className="py-4 text-center text-gray-500">
            Aucune présence enregistrée pour cet utilisateur.
          </div>
        )}
      </div>
    </Popup>
  );
};

export default UserAttendanceDetails;
