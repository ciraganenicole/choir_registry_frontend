import 'chart.js/auto';

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaPlus } from 'react-icons/fa';

import Layout from '@/components/layout';

import UserRegistration from './users/crud/create';
import type { User } from './users/type';
import { FetchUsers } from './users/user_actions';

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const users = await FetchUsers();
        setTotalUsers(users.length);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    getUsers();
  }, []);

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Present',
        backgroundColor: '#04cc25',
        data: [85, 95, 75, 80, 70, 50, 60],
      },
      {
        label: 'Absent',
        backgroundColor: '#cc0411',
        data: [15, 10, 25, 20, 30, 50, 40],
      },
    ],
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  console.log(users);
  const handleUserCreated = async () => {
    const updatedUsers = await FetchUsers();
    setUsers(updatedUsers);
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
      <div className="flex w-full flex-col gap-8 px-12 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          {/* <p className="text-lg font-medium text-gray-900">
            {formattedDate.replace(/\b\w/g, (char) => char.toUpperCase())}
          </p> */}
        </div>

        <div className="flex gap-12">
          <div className="flex-1 rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Status
              </h3>

              <div className="flex flex-row gap-4">
                <select className="rounded-md border border-gray-900 px-4 py-1">
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

                <select className="rounded-md border border-gray-900 px-4 py-1">
                  <option>2025</option>
                </select>
              </div>
            </div>
            <Bar data={chartData} />
          </div>

          <div className="flex w-1/4 flex-col justify-between gap-4">
            <div className="rounded-md bg-white px-4 py-3 shadow-md">
              <h3 className="mb-2 text-[16px] font-semibold text-gray-900/70">
                Nombre Total
              </h3>

              <div className="flex flex-row items-center justify-between">
                <p className="text-2xl font-bold">{totalUsers}</p>
                <button
                  onClick={() => setIsPopupOpen(true)}
                  className="rounded-[5px] bg-gray-900 p-[4px] text-sm text-white transition hover:bg-gray-400"
                >
                  <FaPlus className="text-[10px]" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Daily stats
                </h2>
                <p className="text-[16px] font-bold text-blue-700">
                  {formattedDate.replace(/\b\w/g, (char) => char.toUpperCase())}
                </p>
              </div>

              <div className="rounded-md bg-white shadow-md">
                <div className="flex flex-row justify-between px-4 py-3">
                  <div>
                    <h3 className="text-[14px] font-medium text-gray-900/70">
                      Total
                    </h3>
                    <p className="text-[20px] font-bold text-gray-900">
                      {Math.floor(totalUsers * 0.8)}
                    </p>
                  </div>

                  <div className="flex flex-row justify-between gap-4">
                    <ul className="flex flex-col gap-2 text-[14px] font-medium text-gray-900/70">
                      <li>On-time</li>
                      <li>Late</li>
                    </ul>

                    <ul className="flex flex-col gap-2 text-[14px] font-bold text-gray-900">
                      <li>20</li>
                      <li>4</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-400 px-4 py-2">
                  <h3 className="text-[14px] font-bold text-green-500">
                    Present(s)
                  </h3>
                </div>
              </div>

              <div className="rounded-md bg-white shadow-md">
                <div className="flex flex-row justify-between px-4 py-3">
                  <div>
                    <h3 className="text-[14px] font-medium text-gray-900/70">
                      Total
                    </h3>
                    <p className="text-[20px] font-bold text-gray-900">
                      {Math.floor(totalUsers * 0.8)}
                    </p>
                  </div>

                  <div className="flex flex-row justify-between gap-4">
                    <ul className="flex flex-col gap-2 text-[14px] font-medium text-gray-900/70">
                      <li>Justif.</li>
                      <li>No Justif.</li>
                    </ul>

                    <ul className="flex flex-col gap-2 text-[14px] font-bold text-gray-900">
                      <li>20</li>
                      <li>4</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-400 px-4 py-2">
                  <h3 className="text-[14px] font-bold text-orange-500">
                    Retard(s)
                  </h3>
                </div>
              </div>

              <div className="rounded-md bg-white shadow-md">
                <div className="flex flex-row justify-between px-4 py-3">
                  <div>
                    <h3 className="text-[14px] font-medium text-gray-900/70">
                      Total
                    </h3>
                    <p className="text-[20px] font-bold text-gray-900">
                      {Math.floor(totalUsers * 0.8)}
                    </p>
                  </div>

                  <div className="flex flex-row justify-between gap-4">
                    <ul className="flex flex-col gap-2 text-[14px] font-medium text-gray-900/70">
                      <li>Justif.</li>
                      <li>No Justif.</li>
                    </ul>

                    <ul className="flex flex-col gap-2 text-[14px] font-bold text-gray-900">
                      <li>20</li>
                      <li>4</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-gray-400 px-4 py-2">
                  <h3 className="text-[14px] font-bold text-red-500">
                    Absent(s)
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isPopupOpen && (
        <UserRegistration
          onClose={() => setIsPopupOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </Layout>
  );
};

export default AdminDashboard;
