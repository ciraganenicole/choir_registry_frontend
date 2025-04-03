import 'chart.js/auto';

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { FaPlus } from 'react-icons/fa';

import Layout from '@/components/layout';

import { FetchUsers } from './users/user_actions';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

interface PaginatedResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const response = await FetchUsers({
          page: 1,
          limit: 10,
        });
        const paginatedResponse: PaginatedResponse = {
          // items: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: Math.ceil(response.total / response.limit),
          items: [],
        };
        setUsers(paginatedResponse.items);
        setTotalUsers(paginatedResponse.total);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
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
    labels: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    datasets: [
      {
        label: 'Présent',
        backgroundColor: '#04cc25',
        data: attendanceByDay.present,
      },
      {
        label: 'Retard',
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

  const handleAddUser = () => {
    router.push('/admin/users/new');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full flex-col gap-8 px-3 py-6 md:px-6 lg:px-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Tableau de bord
          </h2>
        </div>

        <div className="flex flex-col-reverse gap-12 lg:flex-row">
          <div className="flex-1 rounded-lg bg-white p-4 shadow-lg md:p-6">
            <div className="mb-8 flex flex-row items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900 md:text-lg">
                État des présences
              </h3>

              <div className="flex flex-row gap-2 md:gap-4">
                <select className="rounded-md border border-gray-900 px-2 py-[2px] text-[12px] md:px-4 md:py-1">
                  <option>Janvier</option>
                  <option>Février</option>
                  <option>Mars</option>
                  <option>Avril</option>
                  <option>Mai</option>
                  <option>Juin</option>
                  <option>Juillet</option>
                  <option>Août</option>
                  <option>Septembre</option>
                  <option>Octobre</option>
                  <option>Novembre</option>
                  <option>Décembre</option>
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
                  onClick={handleAddUser}
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
                {[
                  {
                    label: 'Présent(s)',
                    count: attendanceByDay.present.reduce((a, b) => a + b, 0),
                  },
                  {
                    label: 'Retard(s)',
                    count: attendanceByDay.late.reduce((a, b) => a + b, 0),
                  },
                  {
                    label: 'Absence(s)',
                    count: attendanceByDay.absent.reduce((a, b) => a + b, 0),
                  },
                ].map(({ label, count }) => (
                  <div key={label} className="rounded-md bg-white shadow-md">
                    <div className="flex flex-row justify-between px-4 py-3">
                      <div>
                        <h3 className="text-[14px] font-medium text-gray-900/70">
                          {label}
                        </h3>
                        <p className="text-[20px] font-bold text-gray-900">
                          {count}
                        </p>
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
