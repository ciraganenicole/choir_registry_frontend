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
      <div className="flex w-full flex-col gap-8 px-4 py-6 md:px-8 lg:px-12">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="mb-4 flex w-full items-center justify-between md:mb-0 md:gap-2">
            <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
              Liste des choristes
            </h2>
            <button
              onClick={() => setIsPopupOpen(true)}
              className="flex items-center gap-2 rounded-sm bg-gray-900 p-1  text-sm text-white  hover:bg-gray-700 md:rounded-md md:p-3 lg:hidden"
            >
              <FaPlus />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <SearchInput onSearch={handleSearch} />
            <button
              onClick={() => setIsPopupOpen(true)}
              className="hidden w-[180px] items-center gap-2 rounded-md bg-gray-900 px-4 py-3 text-sm  text-white hover:bg-gray-700 lg:flex"
            >
              <FaPlus /> Nouveau membre
            </button>
          </div>
        </div>

        {/* Table Container for Desktop/Tablets */}
        <div className="table-container hidden rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm md:block">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-md px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
                  Num
                </th>
                <th className="px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
                  Name
                </th>
                <th className="px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
                  Surname
                </th>
                <th className="px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
                  Phone
                </th>
                <th className="px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
                  Matricule
                </th>
                <th className="rounded-tr-md px-2 py-[8px] text-left lg:px-4 lg:py-[14px]">
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

        {/* Card Container for Mobile */}
        <div className="card-container md:hidden">
          {currentUsers.map((user) => (
            <div
              key={user.id}
              className="user-card mb-4 rounded-md bg-white shadow-md"
            >
              <div className="user-info p-4">
                <h2 className="mb-2 text-[18px] font-bold">
                  {user.name} {user.surname}
                </h2>
                <div className="flex flex-row items-center gap-4">
                  <div className="text-md font-semibold">
                    <p>Phone:</p>
                    <p>Matricule:</p>
                  </div>
                  <div className="text-md">
                    <p>{user.phoneNumber}</p> <p>{user.matricule}</p>
                  </div>
                </div>
              </div>
              <div className="h-[1px] w-full bg-gray-500" />
              <div>
                {/* <p>{user.voice}</p> */}
                <div className="actions flex items-center justify-end gap-4 px-4 py-2">
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
                </div>
              </div>
            </div>
          ))}
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
