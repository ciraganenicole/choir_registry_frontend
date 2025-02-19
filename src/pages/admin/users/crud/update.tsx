import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';

import type { User } from '../type';
import { UpdateUserAction } from '../user_actions';

interface UpdateProps {
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  user: User;
}

const UpdateUser: React.FC<UpdateProps> = ({ onClose, onUpdate, user }) => {
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
        const updatedUser = await UpdateUserAction(userData.id, userData);

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
    <Popup title="Update User" onClose={onClose}>
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
    </Popup>
  );
};

export default UpdateUser;
