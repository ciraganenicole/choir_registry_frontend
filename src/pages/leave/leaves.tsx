import { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';

import AddLeave from './add';
import { useLeave } from './logic';

const LeaveTable = () => {
  const { users, leaveRecords, fetchUsersLeave } = useLeave(); // Add fetchUsersLeave to update the leave records
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupLeaveOpen, setIsPopupLeaveOpen] = useState(false);
  const leavesPerPage = 8;

  const leaveTypes = [
    { value: 'sick', label: 'Maladie' },
    { value: 'suspension', label: 'Suspension' },
    { value: 'vacation', label: 'Vacance' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Travail' },
    { value: 'Other', label: 'Autres' },
  ];

  // Function to get the leaveType label from the value
  const getLeaveTypeLabel = (value: string) => {
    const leaveType = leaveTypes.find((type) => type.value === value);
    return leaveType ? leaveType.label : 'Unknown';
  };

  // Flatten leaveRecords into an array with user details
  console.log(leaveRecords); // Add this to inspect the structure

  const allLeaves = Object.entries(leaveRecords).flatMap(
    ([userId, leaveRecord]) => {
      const leaves = leaveRecord.data; // Access the 'data' property where the leaves are stored

      if (Array.isArray(leaves)) {
        return leaves.map((leave: any) => ({
          userId: Number(userId),
          name: users.find((u) => u.id === Number(userId))?.name || 'Unknown',
          surname:
            users.find((u) => u.id === Number(userId))?.surname || 'Unknown',
          ...leave,
        }));
      }
      console.warn(`Expected an array of leaves but got:`, leaveRecord);
      return []; // Return an empty array in case it's not an array
    },
  );

  // Filter leaves based on search query
  const filteredLeaves = allLeaves.filter((leave) =>
    `${leave.name} ${leave.surname} ${leave.motif}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const indexOfLastLeave = currentPage * leavesPerPage;
  const indexOfFirstLeave = indexOfLastLeave - leavesPerPage;
  const currentLeaves = filteredLeaves.slice(
    indexOfFirstLeave,
    indexOfLastLeave,
  );
  const totalPages = Math.ceil(filteredLeaves.length / leavesPerPage);

  const handleLeaveCreated = async () => {
    // After adding a leave, refetch the users and their leave records
    await fetchUsersLeave(); // Use this function to update the leave records from the API
  };

  useEffect(() => {
    fetchUsersLeave(); // Initial fetch when the component mounts
  }, []);

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col justify-between py-4 md:flex-row md:items-center">
          <h2 className="mb-4 text-xl font-semibold md:mb-0 lg:text-2xl">
            Leave Records
          </h2>
          <div className="mb-4 flex w-full items-center justify-between gap-2 md:mb-0">
            <SearchInput onSearch={setSearchQuery} />
            <button
              onClick={() => setIsPopupLeaveOpen(true)}
              className="rounded-md bg-blue-600 p-2 text-white shadow-md hover:bg-blue-700"
            >
              <FaPlus />
            </button>
            <button
              onClick={() => setIsPopupLeaveOpen(true)}
              className="hidden rounded-md bg-blue-600 px-4 py-2 text-white shadow-md hover:bg-blue-700 md:block"
            >
              Add Leave
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:hidden">
          {currentLeaves.length > 0 ? (
            currentLeaves.map((leave, index) => (
              <div
                key={leave.id || index}
                className="rounded-lg border border-gray-300 p-4 shadow-sm sm:table-row"
              >
                <div className="sm:table-cell">
                  {indexOfFirstLeave + index + 1}
                </div>
                <div className="sm:table-cell">{leave.name}</div>
                <div className="sm:table-cell">{leave.surname}</div>
                <div className="sm:table-cell">{leave.startDate}</div>
                <div className="sm:table-cell">{leave.endDate}</div>
                <div className="sm:table-cell">
                  {getLeaveTypeLabel(leave.leaveType)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center">No leave records found.</p>
          )}
        </div>

        <div className="mb-4 hidden rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm md:block">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-md px-4 py-2 text-start">N</th>
                <th className="px-4 py-2 text-start">Name</th>
                <th className="px-4 py-2 text-start">Surname</th>
                <th className="px-4 py-2 text-start">Start Date</th>
                <th className="px-4 py-2 text-start">End Date</th>
                <th className="rounded-tr-md px-4 py-2 text-start">Motif</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaves.length > 0 ? (
                currentLeaves.map((leave, index) => (
                  <tr
                    key={leave.id || index}
                    className="border border-gray-500"
                  >
                    <td className="border border-gray-500 px-4 py-3">
                      {indexOfFirstLeave + index + 1}
                    </td>
                    <td className="px-4 py-2">{leave.name}</td>
                    <td className="px-4 py-2">{leave.surname}</td>
                    <td className="px-4 py-2">{leave.startDate}</td>
                    <td className="px-4 py-2">{leave.endDate}</td>
                    <td className="px-4 py-2">
                      {getLeaveTypeLabel(leave.leaveType)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center">
                    No leave records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isPopupLeaveOpen && (
          <AddLeave
            onClose={() => setIsPopupLeaveOpen(false)}
            onUserCreated={handleLeaveCreated}
          />
        )}

        {totalPages > 1 && (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </Layout>
  );
};

export default LeaveTable;
