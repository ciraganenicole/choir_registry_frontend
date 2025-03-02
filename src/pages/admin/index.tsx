import 'chart.js/auto';

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaPlus } from 'react-icons/fa';

import Layout from '@/components/layout';

import { FetchUsers } from './users/user_actions';

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const fetchedUsers = await FetchUsers();
        setUsers(fetchedUsers);
        setTotalUsers(fetchedUsers.length);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    getUsers();
  }, []);

  const attendanceByDay = {
    present: Array(7).fill(0),
    late: Array(7).fill(0),
    absent: Array(7).fill(0),
  };

  users.forEach(() => {
    const randomDay = Math.floor(Math.random() * 7);
    attendanceByDay.present[randomDay] += 1;

    if (Math.random() > 0.5) {
      attendanceByDay.late[randomDay] += 1;
    } else {
      attendanceByDay.absent[randomDay] += 1;
    }
  });

  const chartData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Present',
        backgroundColor: '#04cc25',
        data: attendanceByDay.present,
      },
      {
        label: 'Late',
        backgroundColor: '#fc842d',
        data: attendanceByDay.late,
      },
      {
        label: 'Absent',
        backgroundColor: '#cc0411',
        data: attendanceByDay.absent,
      },
    ],
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Layout>
      <div className="flex w-full flex-col gap-8 px-3 py-6 md:px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        </div>

        <div className="flex flex-col-reverse gap-12 lg:flex-row">
          <div className="flex-1 rounded-lg bg-white p-4 shadow-lg md:p-6">
            <div className="mb-8 flex flex-row items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900 md:text-lg">
                Attendance Status
              </h3>

              <div className="flex flex-row gap-2 md:gap-4">
                <select className="rounded-md border border-gray-900 px-2 py-[2px] text-[12px] md:px-4 md:py-1">
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  <option>April</option>
                  <option>May</option>
                  <option>June</option>
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
            </div>
            <Bar data={chartData} />
          </div>

          <div className="flex flex-col gap-4 lg:w-1/4">
            <div className="rounded-md bg-white px-4 py-3 shadow-md">
              <h3 className="mb-2 text-[16px] font-semibold text-gray-900/70">
                Nombre Total
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{totalUsers}</p>
                <button
                  onClick={() => console.log('Add user')}
                  className="rounded-[5px] bg-gray-900 p-[4px] text-sm text-white transition hover:bg-gray-400"
                >
                  <FaPlus className="text-[10px]" />
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4">
              <p className="text-[16px] font-bold text-blue-700">
                {formattedDate.replace(/\b\w/g, (char) => char.toUpperCase())}
              </p>

              <div className="grid w-full gap-4 md:grid-cols-3 lg:grid-cols-1">
                {['Present(s)', 'Retard(s)', 'Absence(s)'].map((status) => (
                  <div key={status} className="rounded-md bg-white shadow-md">
                    <div className="flex flex-row justify-between px-4 py-3">
                      <div>
                        <h3 className="text-[14px] font-medium text-gray-900/70">
                          Total
                        </h3>
                        <p className="text-[20px] font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
