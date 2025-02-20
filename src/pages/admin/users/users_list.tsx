import React, { useEffect, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import { filterUsers, sortUsers } from '@/utils/users';

import UserRegistration from './crud/create';
import DeleteUser from './crud/delete';
import UpdateUser from './crud/update';
import ViewUser from './crud/view';
import type { User } from './type';
import { FetchUsers } from './user_actions';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPopupViewOpen, setIsPopupViewOpen] = useState(false);
  const [isPopupUpdateOpen, setIsPopupUpdateOpen] = useState(false);
  const [isPopupDeleteOpen, setIsPopupDeleteOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  useEffect(() => {
    const loadUsers = async () => {
      const usersData = await FetchUsers();
      setUsers(usersData);
    };

    loadUsers();
  }, [currentPage]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsPopupViewOpen(true);
  };

  const handleUpdate = (user: User) => {
    setSelectedUser(user);
    setIsPopupUpdateOpen(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map((user) =>
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
    );
    setUsers(updatedUsers);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsPopupDeleteOpen(true);
  };

  const handleDeleteConfirmed = (userId: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  const handleUserCreated = async () => {
    const updatedUsers = await FetchUsers();
    setUsers(updatedUsers);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredUsers = filterUsers(users, searchQuery);
  const sortedUsers = sortUsers(filteredUsers);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <Layout>
      <div className="flex w-full flex-col gap-8 px-12 py-6">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Liste des choristes
          </h2>
          <div className="flex items-center gap-4">
            <SearchInput onSearch={handleSearch} />
            <button
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              <FaPlus /> Nouveau membre
            </button>
          </div>
        </div>

        <div className="rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-md px-4 py-[14px] text-left">Num</th>
                <th className="px-4 py-[14px] text-left">Name</th>
                <th className="px-4 py-[14px] text-left">Surname</th>
                <th className="px-4 py-[14px] text-left">Phone</th>
                <th className="px-4 py-[14px] text-left">Matricule</th>
                <th className="rounded-tr-md px-4 py-[14px] text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-400 last:border-0"
                >
                  <td className="px-4 py-3">{indexOfFirstUser + index + 1}</td>
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.surname}</td>
                  <td className="px-4 py-3">{user.phoneNumber}</td>
                  <td className="px-4 py-3">{user.matricule}</td>
                  <td className="flex space-x-4 px-4 py-3">
                    <button
                      onClick={() => handleView(user)}
                      className="text-green-500 hover:text-green-700"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleUpdate(user)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
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
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {isPopupOpen && (
        <UserRegistration
          onClose={() => setIsPopupOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
      {isPopupViewOpen && (
        <ViewUser
          onClose={() => setIsPopupViewOpen(false)}
          user={selectedUser}
        />
      )}
      {isPopupUpdateOpen && selectedUser && (
        <UpdateUser
          onClose={() => setIsPopupUpdateOpen(false)}
          onUpdate={handleUpdateUser}
          user={selectedUser}
        />
      )}
      {isPopupDeleteOpen && (
        <DeleteUser
          onClose={() => setIsPopupDeleteOpen(false)}
          onUserDeleted={handleDeleteConfirmed}
          selectedUser={selectedUser}
        />
      )}
    </Layout>
  );
};

export default UsersManagement;
