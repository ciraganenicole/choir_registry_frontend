import React, { useEffect, useState } from 'react';
import Select from 'react-select';

import Input from '@/components/input';
import Popup from '@/components/popup';

import {
  Commission,
  Commune,
  EducationLevel,
  Gender,
  MaritalStatus,
  Profession,
  type User,
  UserCategory,
} from '../../../../lib/user/type';
import { UpdateUserAction } from '../../../../lib/user/user_actions';

interface UpdateProps {
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  user: User;
}

const UpdateUser: React.FC<UpdateProps> = ({ onClose, onUpdate, user }) => {
  const [userData, setUserData] = useState<User | null>(user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const handleChange = (
    field: keyof User,
    value: string | string[] | null | undefined,
  ) => {
    setUserData((prevData) => {
      if (!prevData) return null;
      return {
        ...prevData,
        [field]: value,
      };
    });
  };

  const handleSelectChange = (
    field: keyof User,
    value: string | null,
    enumType:
      | typeof MaritalStatus
      | typeof EducationLevel
      | typeof Profession
      | typeof Gender
      | typeof Commune,
  ) => {
    if (!value) {
      handleChange(field, null);
      return;
    }
    // Validate that the value exists in the enum
    if (Object.values(enumType).includes(value as any)) {
      handleChange(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (userData) {
      try {
        // Exclude read-only and non-updatable fields
        const updatePayload = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          gender: userData.gender,
          maritalStatus: userData.maritalStatus,
          educationLevel: userData.educationLevel,
          profession: userData.profession,
          commune: userData.commune,
          churchOfOrigin: userData.churchOfOrigin,
          competenceDomain: userData.competenceDomain,
          phoneNumber: userData.phoneNumber,
          whatsappNumber: userData.whatsappNumber,
          quarter: userData.quarter,
          reference: userData.reference,
          address: userData.address,
          commissions: userData.commissions,
          categories: userData.categories,
          isActive: userData.isActive,
        };

        const updatedUser = await UpdateUserAction(userData.id, updatePayload);
        if (updatedUser) {
          onUpdate(updatedUser);
          onClose();
        }
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Failed to update user',
        );
      }
    }
  };

  // Convert array to react-select options
  const commissionOptions = Object.entries(Commission).map(([_, value]) => ({
    value,
    label: value,
  }));

  const categoryOptions = Object.entries(UserCategory).map(([_, value]) => ({
    value,
    label: value,
  }));

  if (!userData) return null;

  const {
    firstName,
    lastName,
    email,
    gender,
    maritalStatus,
    educationLevel,
    profession,
    commune,
    churchOfOrigin,
    competenceDomain,
    phoneNumber,
    whatsappNumber,
    quarter,
    reference,
    address,
    commissions,
    categories,
  } = userData || {};

  return (
    <Popup title="Mettre à jour" onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 md:grid-cols-3"
      >
        {error && (
          <div className="col-span-2 rounded-md bg-red-100 p-4 text-red-700 md:col-span-3">
            {error}
          </div>
        )}
        {/* <div className="relative">
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
        </div> */}
        <Input
          name="firstName"
          label="Nom"
          value={firstName || ''}
          onChange={(value: string) => handleChange('firstName', value)}
          placeholder="Nom"
        />
        <Input
          name="lastName"
          label="Prénom"
          value={lastName || ''}
          onChange={(value: string) => handleChange('lastName', value)}
          placeholder="Prénom"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Genre
          </label>
          <select
            name="gender"
            value={gender || ''}
            onChange={(e) =>
              handleSelectChange('gender', e.target.value, Gender)
            }
            className="block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Sélectionner un genre</option>
            {Object.entries(Gender).map(([key, value]) => (
              <option key={key} value={value}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            État Civil
          </label>
          <select
            name="maritalStatus"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={maritalStatus || ''}
            onChange={(e) =>
              handleSelectChange('maritalStatus', e.target.value, MaritalStatus)
            }
          >
            <option value="">Sélectionner un état civil</option>
            {Object.values(MaritalStatus).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Niveau d&apos;Études
          </label>
          <select
            name="educationLevel"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={educationLevel || ''}
            onChange={(e) =>
              handleSelectChange(
                'educationLevel',
                e.target.value,
                EducationLevel,
              )
            }
          >
            <option value="">Sélectionner un niveau</option>
            {Object.values(EducationLevel).map((value) => (
              <option key={value} value={value}>
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
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={profession || ''}
            onChange={(e) =>
              handleSelectChange('profession', e.target.value, Profession)
            }
          >
            <option value="">Sélectionner une profession</option>
            {Object.values(Profession).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <Input
          name="competenceDomain"
          label="Compétence"
          value={competenceDomain || ''}
          onChange={(value: string) => handleChange('competenceDomain', value)}
          placeholder="Compétence"
        />

        <Input
          name="churchOfOrigin"
          label="Église d'Origine"
          value={churchOfOrigin || ''}
          onChange={(value: string) => handleChange('churchOfOrigin', value)}
          placeholder="Église d'origine"
        />
        <Input
          name="phoneNumber"
          label="Téléphone"
          value={phoneNumber || ''}
          onChange={(value: string) => handleChange('phoneNumber', value)}
          placeholder="Téléphone"
        />
        <Input
          name="whatsappNumber"
          label="WhatsApp"
          value={whatsappNumber || ''}
          onChange={(value: string) => handleChange('whatsappNumber', value)}
          placeholder="WhatsApp"
        />

        <Input
          name="email"
          type="email"
          label="Email"
          value={email || ''}
          onChange={(value: string) => handleChange('email', value)}
          placeholder="Email"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Commune
          </label>
          <select
            name="commune"
            value={commune || ''}
            onChange={(e) =>
              handleSelectChange('commune', e.target.value, Commune)
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Sélectionner une commune</option>
            {Object.entries(Commune).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <Input
          name="quarter"
          label="Quartier"
          value={quarter || ''}
          onChange={(value: string) => handleChange('quarter', value)}
          placeholder="Quartier"
        />

        <Input
          name="reference"
          label="Référence"
          value={reference || ''}
          onChange={(value: string) => handleChange('reference', value)}
          placeholder="Référence"
        />

        <div className="col-span-2 md:col-span-1">
          <Input
            name="address"
            label="Adresse"
            value={address || ''}
            onChange={(value: string) => handleChange('address', value)}
            placeholder="Adresse"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Commissions
          </label>
          <Select
            isMulti
            name="commissions"
            value={commissions?.map((commission) => ({
              value: commission,
              label: commission,
            }))}
            onChange={(selectedOptions) => {
              const values = selectedOptions.map((option) => option.value);
              setUserData((prev) =>
                prev ? { ...prev, commissions: values } : null,
              );
            }}
            options={commissionOptions}
            className="mt-1"
            classNamePrefix="select"
            placeholder="Commissions..."
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Catégories
          </label>
          <Select
            isMulti
            name="categories"
            value={categories?.map((category) => ({
              value: category,
              label: category,
            }))}
            onChange={(selectedOptions) => {
              const values = selectedOptions.map((option) => option.value);
              setUserData((prev) =>
                prev ? { ...prev, categories: values } : null,
              );
            }}
            options={categoryOptions}
            className="mt-1"
            classNamePrefix="select"
            placeholder="Catégories..."
          />
        </div>

        <button
          type="submit"
          className="col-span-2 w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 md:col-span-1"
        >
          Mettre à jour
        </button>
      </form>
    </Popup>
  );
};

export default UpdateUser;
