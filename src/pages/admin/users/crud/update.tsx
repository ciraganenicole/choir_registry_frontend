import React, { useEffect, useState } from 'react';
import { FaCamera, FaUpload } from 'react-icons/fa';

import Input from '@/components/input';
import Popup from '@/components/popup';
import { useCloudinaryWidget } from '@/utils/cloudinary';

import {
  Commission,
  Commune,
  EducationLevel,
  Gender,
  MaritalStatus,
  Profession,
  type User,
  UserCategory,
} from '../type';
import { UpdateUserAction } from '../user_actions';

interface UpdateProps {
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  user: User;
}

const UpdateUser: React.FC<UpdateProps> = ({ onClose, onUpdate, user }) => {
  const [userData, setUserData] = useState<User | null>(user);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { uploadToCloudinary } = useCloudinaryWidget();

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const handleImageUpload = async (source: 'local' | 'camera') => {
    try {
      setUploadError(null);
      setIsUploading(true);

      const imageUrl = await uploadToCloudinary(source);
      setUserData((prevData) =>
        prevData ? { ...prevData, profilePicture: imageUrl } : null,
      );
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadError(
        err instanceof Error ? err.message : 'Failed to upload image',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserData((prevData) =>
      prevData ? { ...prevData, [name]: value } : null,
    );
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const values = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setUserData((prevData) =>
      prevData ? { ...prevData, [name]: values } : null,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="size-32 overflow-hidden rounded-full border-4 border-gray-200">
              {userData.profilePicture ? (
                <img
                  src={userData.profilePicture}
                  alt="Photo de profil"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center bg-gray-100">
                  <FaCamera className="size-8 text-gray-400" />
                  <span className="mt-2 text-xs text-gray-500">
                    Ajouter une photo
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              <button
                type="button"
                onClick={() => handleImageUpload('local')}
                className="cursor-pointer rounded-full bg-blue-500 p-2 text-white shadow-lg transition-colors hover:bg-blue-600 disabled:opacity-50"
                title="Choisir depuis la galerie"
                disabled={isUploading}
              >
                <FaUpload className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleImageUpload('camera')}
                className="cursor-pointer rounded-full bg-blue-500 p-2 text-white shadow-lg transition-colors hover:bg-blue-600 disabled:opacity-50"
                title="Prendre une photo"
                disabled={isUploading}
              >
                <FaCamera className="size-4" />
              </button>
            </div>
            {uploadError && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-red-500">
                {uploadError}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="firstName"
            label="First Name"
            value={userData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            name="lastName"
            label="Last Name"
            value={userData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              name="gender"
              value={userData.gender}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {Object.entries(Gender).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Marital Status
            </label>
            <select
              name="maritalStatus"
              value={userData.maritalStatus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {Object.entries(MaritalStatus).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Education Level
            </label>
            <select
              name="educationLevel"
              value={userData.educationLevel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {Object.entries(EducationLevel).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Profession
            </label>
            <select
              name="profession"
              value={userData.profession}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {Object.entries(Profession).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          name="competenceDomain"
          label="Competence Domain"
          value={userData.competenceDomain}
          onChange={handleChange}
        />

        <Input
          name="churchOfOrigin"
          label="Church of Origin"
          value={userData.churchOfOrigin}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Commune
            </label>
            <select
              name="commune"
              value={userData.commune}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              {Object.entries(Commune).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="quarter"
            label="Quarter"
            value={userData.quarter}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          name="reference"
          label="Reference"
          value={userData.reference}
          onChange={handleChange}
          required
        />

        <Input
          name="address"
          label="Address"
          value={userData.address}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="phoneNumber"
            label="Phone Number"
            value={userData.phoneNumber}
            onChange={handleChange}
            required
          />
          <Input
            name="whatsappNumber"
            label="WhatsApp Number"
            value={userData.whatsappNumber}
            onChange={handleChange}
          />
        </div>

        <Input
          name="email"
          type="email"
          label="Email"
          value={userData.email}
          onChange={handleChange}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Commissions
          </label>
          <select
            name="commissions"
            multiple
            value={userData.commissions}
            onChange={handleMultiSelect}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {Object.entries(Commission).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Categories
          </label>
          <select
            name="categories"
            multiple
            value={userData.categories}
            onChange={handleMultiSelect}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {Object.entries(UserCategory).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
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
