import React, { useEffect, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';

import Layout from '@/components/layout';

import { deleteUser, fetchUsers } from './user_actions';
import UserPopup from './user_popup'; // Import the UserPopup component

interface User {
  id: number;
  name: string;
  surname: string;
  phoneNumber: string;
  matricule: string;
  key: string | null;
  created_at: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // State for the selected user
  const [popupMode, setPopupMode] = useState<'view' | 'update' | 'add' | null>(
    null,
  ); // State for the popup mode

  useEffect(() => {
    const loadUsers = async () => {
      const usersData = await fetchUsers();
      setUsers(usersData);
    };

    loadUsers();
  }, []);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setPopupMode('view');
  };

  const handleUpdate = (user: User) => {
    setSelectedUser(user);
    setPopupMode('update');
  };

  const handleAdd = () => {
    // setSelectedUser(null);
    setPopupMode('add');
  };

  const handleClosePopup = () => {
    setSelectedUser(null);
    setPopupMode(null);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
    );
    setUsers(updatedUsers);
  };

  return (
    <Layout>
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <h2 className="text-lg font-semibold">User Management</h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            <FaPlus /> Nouveau membre
          </button>
        </div>

        <div className="mx-auto max-w-7xl rounded-lg bg-gray-200 bg-white p-[4px] shadow-md">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-lg px-4 py-[14px] text-left">Num</th>
                <th className="px-4 py-[14px] text-left">Name</th>
                <th className="px-4 py-[14px] text-left">Surname</th>
                <th className="px-4 py-[14px] text-left">Phone</th>
                <th className="px-4 py-[14px] text-left">Matricule</th>
                <th className="rounded-tr-lg px-4 py-[14px] text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-400 last:border-0"
                >
                  <td className="px-4 py-3">{index}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.surname}</td>
                  <td className="px-4 py-3">{user.phoneNumber}</td>
                  <td className="px-4 py-3">{user.matricule}</td>
                  <td className="flex space-x-4 px-4 py-3">
                    <button
                      onClick={() => handleView(user)} // Open the view popup
                      className="text-green-500 hover:text-green-700"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleUpdate(user)} // Open the update popup
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {popupMode && (
          <UserPopup
            user={selectedUser}
            mode={popupMode}
            onClose={handleClosePopup}
            onUpdate={handleUpdateUser}
          />
        )}
      </div>
    </Layout>
  );
};

export default UsersManagement;
