import React from 'react';
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
  UserCategory,
} from '../type';
import { CreateUser } from '../user_actions';
import ImageUpload from './image';

interface FormData {
  firstName: string;
  lastName: string;
  gender: string;
  maritalStatus: string;
  educationLevel: string;
  profession: string;
  competenceDomain: string;
  churchOfOrigin: string;
  commune: string;
  quarter: string;
  reference: string;
  address: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  commissions: Commission[];
  categories: UserCategory[];
  profilePicture?: string;
}

type SelectOption<T> = {
  value: T;
  label: string;
};

interface CreateUserProps {
  onClose: () => void;
  onUserCreated: () => void;
}

const UserRegistration: React.FC<CreateUserProps> = ({
  onClose,
  onUserCreated,
}) => {
  const { formData, setFormData, handleSubmit } = CreateUser<FormData>(
    onClose,
    onUserCreated,
  );

  const handleUploadSuccess = (imageUrl: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      profilePicture: imageUrl,
    }));
  };

  const handleUploadError = (error: string) => {
    console.error('Upload failed:', error);
    // You could add a toast notification here
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string,
    inputName?: string,
  ) => {
    if (typeof e === 'string' && inputName) {
      // Handle Input component onChange (direct value)
      setFormData((prev: FormData) => ({
        ...prev,
        [inputName]: e,
      }));
    } else if (typeof e === 'object' && 'target' in e) {
      // Handle select element onChange (event object)
      const { name, value } = e.target;
      setFormData((prev: FormData) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <Popup title="Register New User" onClose={onClose} style="md:w-[70%]">
      <form onSubmit={handleSubmit} className="">
        <div className="mb-6 flex justify-center">
          <ImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            name="firstName"
            onChange={(value: string) => handleChange(value, 'firstName')}
            required
            placeholder={'Nom'}
          />
          <Input
            name="lastName"
            onChange={(value: string) => handleChange(value, 'lastName')}
            required
            placeholder={'Prénom'}
          />
          <Input
            name="email"
            type="email"
            onChange={(value: string) => handleChange(value, 'email')}
            required
            placeholder={'Email'}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
              required
            >
              <option value="">Genre</option>
              {Object.entries(Gender).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
              required
            >
              <option value="">Status Marital</option>
              {Object.entries(MaritalStatus).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="churchOfOrigin"
            onChange={(value: string) => handleChange(value, 'churchOfOrigin')}
            required
            placeholder={"Eglise d'origine"}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
              required
            >
              <option value="">Niveau d&apos;éducation</option>
              {Object.entries(EducationLevel).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
              required
            >
              <option value="">Profession</option>
              {Object.entries(Profession).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="competenceDomain"
            onChange={(value: string) =>
              handleChange(value, 'competenceDomain')
            }
            placeholder={'Domaine de compétence'}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            name="phoneNumber"
            onChange={(value: string) => handleChange(value, 'phoneNumber')}
            required
            placeholder={'Numéro de téléphone'}
          />
          <Input
            name="whatsappNumber"
            onChange={(value: string) => handleChange(value, 'whatsappNumber')}
            required
            placeholder={'Numéro de WhatsApp'}
          />
          <div>
            <select
              name="commune"
              value={formData.commune}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
              required
            >
              <option value="">Commune</option>
              {Object.entries(Commune).map(([key, value]) => (
                <option key={key} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            name="quarter"
            onChange={(value: string) => handleChange(value, 'quarter')}
            required
            placeholder={'Quartier'}
          />

          <Input
            name="reference"
            onChange={(value: string) => handleChange(value, 'reference')}
            required
            placeholder={'Référence'}
          />

          <Input
            name="address"
            onChange={(value: string) => handleChange(value, 'address')}
            required
            placeholder={'Adresse'}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Select<SelectOption<Commission>, true>
              isMulti
              name="commissions"
              value={formData.commissions?.map((commission) => ({
                value: commission,
                label: commission,
              }))}
              onChange={(newValue) => {
                setFormData((prev: FormData) => ({
                  ...prev,
                  commissions: newValue?.map((option) => option.value) || [],
                }));
              }}
              options={Object.values(Commission).map((commission) => ({
                value: commission,
                label: commission,
              }))}
              className="mt-1 text-[10px]"
              classNamePrefix="react-select"
              placeholder="Sélectionner les commissions"
              noOptionsMessage={() => 'Aucune commission disponible'}
            />
          </div>

          <div>
            <Select<SelectOption<UserCategory>, true>
              isMulti
              name="categories"
              value={formData.categories?.map((category) => ({
                value: category,
                label: category,
              }))}
              onChange={(newValue) => {
                setFormData((prev: FormData) => ({
                  ...prev,
                  categories: newValue?.map((option) => option.value) || [],
                }));
              }}
              options={Object.values(UserCategory).map((category) => ({
                value: category,
                label: category,
              }))}
              className="mt-1 rounded-md text-[10px]"
              classNamePrefix="react-select"
              placeholder="Sélectionner les catégories"
              noOptionsMessage={() => 'Aucune catégorie disponible'}
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Créer un membre
            </button>
          </div>
        </div>
      </form>
    </Popup>
  );
};

export default UserRegistration;
