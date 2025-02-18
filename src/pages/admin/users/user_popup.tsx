import React, { useEffect, useState } from 'react';

import { updateUser } from './user_actions';
import ViewUser from './view_user';

interface User {
  id: number;
  name: string;
  surname: string;
  phoneNumber: string;
  matricule: string;
  key: string | null;
  created_at: string;
}

interface UserPopupProps {
  user: User | null;
  mode: 'view' | 'update' | 'add';
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const UserPopup: React.FC<UserPopupProps> = ({
  user,
  mode,
  onClose,
  onUpdate,
}) => {
  const [userData, setUserData] = useState<User | null>(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prevData) =>
      prevData ? { ...prevData, [name]: value } : null,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData) {
      try {
        const updatedUser = await updateUser(userData.id, userData);

        if (updatedUser) {
          onUpdate(updatedUser);
          onClose();
        }
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };

  if (!userData) return null;

  return (
    <div className="bg-opacity/50 fixed inset-0 z-50 flex items-center justify-center bg-gray-800">
      <div className="w-1/3 rounded-lg bg-white p-8 shadow-md">
        {/* ✅ Ensure Title is Always Shown */}
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {mode === 'update' ? 'Update User' : 'View User'}
        </h2>

        {/* Conditional Rendering for Update or View Mode */}
        {mode === 'update' ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={userData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="surname"
                className="block text-sm font-medium text-gray-700"
              >
                Surname
              </label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={userData.surname}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
            >
              Update User
            </button>
          </form>
        ) : (
          <ViewUser user={userData} />
        )}

        {/* ✅ Ensure Close Button is Always Shown */}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-md bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UserPopup;
