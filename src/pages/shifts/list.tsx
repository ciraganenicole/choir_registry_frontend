import React, { useState } from 'react';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';

interface ShiftUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  EmployeeShift?: {
    createdAt: string;
    startDate: string;
    endDate: string;
  };
}

interface Shift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  Users: ShiftUser[];
}

const ShiftList = ({ shiftData }: { shiftData: Shift[] }) => {
  const [expandedShift, setExpandedShift] = useState<number | null>(null);

  const toggleShiftDetails = (shiftId: any) => {
    if (expandedShift === shiftId) {
      setExpandedShift(null);
    } else {
      setExpandedShift(shiftId);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate bg-white ">
        <thead>
          <tr className="bg-primary text-white">
            <th className="w-1/5 p-3">Shift Name</th>
            <th className="px-2 py-3">Assigned Date</th>
            <th className="px-2 py-3">Start Time</th>
            <th className="px-2 py-3">End Time</th>
            <th className="px-2 py-3">Start Date</th>
            <th className="px-2 py-3">End Date</th>
          </tr>
        </thead>
        <tbody>
          {shiftData.map((shift: any, index: any) => (
            <React.Fragment key={shift?.id}>
              <tr
                className={`${
                  index % 2 === 0
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'bg-primary/20 hover:bg-primary/30'
                } cursor-pointer`}
                onClick={() => toggleShiftDetails(shift.id)}
              >
                <td className="p-2 text-center">{shift?.shiftName}</td>
                <td className="p-2 text-center">
                  {shift?.Users[0]?.EmployeeShift?.createdAt
                    ? new Date(shift.Users[0].EmployeeShift.createdAt)
                        .toLocaleDateString()
                        .split('/')
                        .join('-')
                    : ''}
                </td>
                <td className="p-2 text-center">{shift?.startTime}</td>
                <td className="p-2 text-center">{shift?.endTime}</td>
                <td className="p-2 text-center">
                  {shift?.Users[0]?.EmployeeShift?.startDate
                    ? new Date(shift.Users[0].EmployeeShift.startDate)
                        .toLocaleDateString()
                        .split('/')
                        .join('-')
                    : ''}
                </td>
                <td className="flex justify-between p-2 text-center">
                  {shift?.Users[0]?.EmployeeShift?.endDate
                    ? new Date(shift.Users[0].EmployeeShift.endDate)
                        .toLocaleDateString()
                        .split('/')
                        .join('-')
                    : ''}

                  <span
                    className="cursor-pointer p-2"
                    onClick={() => toggleShiftDetails(shift.id)}
                  >
                    {expandedShift === shift.id ? (
                      <BsChevronUp size={20} />
                    ) : (
                      <BsChevronDown size={20} />
                    )}
                  </span>
                </td>
              </tr>

              {expandedShift === shift.id && (
                <tr className="bg-primary/30">
                  <td>
                    <table className="border-primary min-w-full border">
                      <thead className="bg-primary text-white">
                        <tr className="flex items-start justify-start">
                          <th className="w-1/5 px-5 py-3">Name</th>
                          <th className="w-1/5 px-5 py-3">Email</th>
                          <th className="w-1/5 px-5 py-3">Phone</th>
                          <th className="w-1/5 px-5 py-3">Address</th>
                          <th className="w-1/5 px-5 py-3">Assigned Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shift.Users.slice(1).map(
                          (user: any, userIndex: any) => (
                            <tr
                              key={user.id}
                              className={`${
                                userIndex % 2 === 0
                                  ? 'bg-primary/5 hover-bg-primary/10'
                                  : 'bg-primary/10 hover:bg-primary/20'
                              } flex  w-full cursor-pointer justify-start`}
                            >
                              <td className="w-1/5 px-5 py-2">{user.name}</td>
                              <td className="w-1/5 px-5 py-2">{user.email}</td>
                              <td className="ml-24 w-1/5 px-5 py-2">
                                {user.phone || 'N/A'}
                              </td>
                              <td className="ml-24 w-1/5 px-5 py-2">
                                {user.address || 'N/A'}
                              </td>
                              <td className="w-1/5 px-5 py-2">
                                {user.EmployeeShift?.createdAt
                                  ? new Date(
                                      user.EmployeeShift.createdAt,
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftList;
