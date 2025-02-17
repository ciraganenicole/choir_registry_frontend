import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import Layout from '@/components/layout';

import { fetchUsers } from './users/user_actions'; // Assuming you have a function to fetch users

const AdminDashboard: React.FC = () => {
  const [totalUsers, setTotalUsers] = useState<number>(0);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const users = await fetchUsers(); // Fetch the list of users
        setTotalUsers(users.length);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    getUsers();
  }, []);

  return (
    <Layout>
      <div className="grid grid-cols-1 gap-12 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Updated Total Users Card with Add Button */}
        <div className="flex w-full flex-row items-center justify-between rounded-lg bg-gray-300 px-8 py-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-[18px] font-medium text-gray-800">
              Total Users
            </h2>
            <p className="text-[36px] font-extrabold text-gray-900">
              {totalUsers}
            </p>
          </div>
          <Link href="/admin/user_registration" className="">
            <button className="rounded-md bg-gray-900 p-2 text-sm text-white transition hover:bg-gray-400">
              <FaPlus />
            </button>
          </Link>
        </div>

        {/* Updated Total present Users Card */}
        <div className="flex w-full flex-row items-center justify-between rounded-lg bg-gray-300 px-8 py-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-[18px] font-medium text-gray-800">
              Membres present / jour
            </h2>
            <p className="text-[36px] font-extrabold text-gray-900">
              {totalUsers}
            </p>
          </div>
        </div>

        {/* Updated Total absent Users Card */}
        <div className="flex w-full flex-row items-center justify-between rounded-lg bg-gray-300 px-8 py-4 shadow-lg">
          <div className="flex flex-col gap-2">
            <h2 className="text-[18px] font-medium text-gray-800">
              Membres absent / jour
            </h2>
            <p className="text-[36px] font-extrabold text-gray-900">
              {totalUsers}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
