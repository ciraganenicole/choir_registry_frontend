import React, { useState } from 'react';
import Select from 'react-select';

import Input from '@/components/input';
import Popup from '@/components/popup';
import { api } from '@/config/api';

import type {
  Commune,
  EducationLevel,
  Gender,
  MaritalStatus,
  Profession,
} from '../../../../lib/user/type';
import { Commission, UserCategory } from '../../../../lib/user/type';

// Add translation function for categories
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    NEWCOMER: 'Adhérant',
    WORSHIPPER: 'Louado',
    COMMITTEE: 'Comité',
  };
  return translations[category] || category;
};

interface CreateUserProps {
  onClose: () => void;
  _onUserCreated: () => void;
}

const UserRegistration: React.FC<CreateUserProps> = ({
  onClose,
  _onUserCreated: onUserCreated,
}) => {
  // Individual state variables for better control
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [churchOfOrigin, setChurchOfOrigin] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
  const [profession, setProfession] = useState<Profession | ''>('');
  const [competenceDomain, setCompetenceDomain] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [commune, setCommune] = useState<Commune | ''>('');
  const [quarter, setQuarter] = useState('');
  const [reference, setReference] = useState('');
  const [address, setAddress] = useState('');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Update the category options to use translations
  const categoryOptions = Object.entries(UserCategory).map(([_, value]) => ({
    value,
    label: translateCategory(value),
  }));

  const validateForm = () => {
    if (!firstName.trim()) return 'Le nom est requis';
    if (!lastName.trim()) return 'Le prénom est requis';
    if (!/^0\d{9}$/.test(phoneNumber.trim()))
      return 'Le numéro de téléphone doit comporter exactement 10 chiffres et commencer par 0';
    if (whatsappNumber && !/^0\d{9}$/.test(whatsappNumber.trim()))
      return 'Le numéro WhatsApp doit comporter exactement 10 chiffres et commencer par 0';
    return null;
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const categoriesWithNewcomer = categories.includes(UserCategory.NEWCOMER)
        ? categories
        : [...categories, UserCategory.NEWCOMER];
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        educationLevel: educationLevel || undefined,
        profession: profession || undefined,
        commune: commune || undefined,
        churchOfOrigin: churchOfOrigin.trim() || undefined,
        competenceDomain: competenceDomain.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        quarter: quarter.trim() || undefined,
        reference: reference.trim() || undefined,
        address: address.trim() || undefined,
        commissions: commissions.length > 0 ? commissions : undefined,
        categories: categoriesWithNewcomer,
        isActive: false,
      };

      const response = await api.post('/users', userData);
      if (response.status === 201 || response.status === 200) {
        onClose();
        onUserCreated();
      } else {
        const { data } = response;
        const errorResponse = Array.isArray(data.errors)
          ? data.errors
              .map((err: any) => {
                const constraints = err.constraints
                  ? Object.values(err.constraints).join(', ')
                  : '';
                const metadata = err.metadata
                  ? JSON.stringify(err.metadata)
                  : '';
                return `${err.field}: ${constraints} ${metadata}`;
              })
              .join('\n')
          : data.message || 'Failed to create user';
        throw new Error(errorResponse);
      }
    } catch (submitError) {
      setError('Failed to create user');
    }
  };

  // Update the type definitions for react-select
  type SelectOption<T> = {
    value: T;
    label: string;
  };

  return (
    <Popup
      title="Enregistrer un nouveau membre"
      onClose={onClose}
      style="md:w-[70%]"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 md:grid-cols-3"
      >
        {error && (
          <div className="col-span-2 mb-4 rounded-md bg-red-50 p-4 md:col-span-3">
            <div className="flex">
              <div className="shrink-0">
                <svg
                  className="size-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* <div className="mb-6 flex justify-center">
          <ImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div> */}

        <Input
          name="firstName"
          label="Prénom *"
          value={firstName}
          onChange={setFirstName}
          placeholder="Nom"
          required
        />
        <Input
          name="lastName"
          label="Nom *"
          value={lastName}
          onChange={setLastName}
          placeholder="Prénom"
          required
        />
        <Input
          name="email"
          type="email"
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="Email"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Genre
          </label>
          <select
            name="gender"
            value={gender}
            onChange={(e) =>
              setGender(e.target.value ? (e.target.value as Gender) : '')
            }
            className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
          >
            <option value="">Sélectionner un genre</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Statut Marital
          </label>
          <select
            name="maritalStatus"
            value={maritalStatus}
            onChange={(e) =>
              setMaritalStatus(
                e.target.value ? (e.target.value as MaritalStatus) : '',
              )
            }
            className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
          >
            <option value="">Sélectionner un statut</option>
            <option value="CELIBATAIRE">Célibataire</option>
            <option value="MARIE(E)">Marié(e)</option>
            <option value="VEUF(VE)">Veuf(ve)</option>
            <option value="DIVORCE(E)">Divorcé(e)</option>
          </select>
        </div>

        <Input
          name="churchOfOrigin"
          label="Église d'origine"
          value={churchOfOrigin}
          onChange={setChurchOfOrigin}
          placeholder="Église d'origine"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Niveau d&apos;éducation
          </label>
          <select
            name="educationLevel"
            value={educationLevel}
            onChange={(e) =>
              setEducationLevel(
                e.target.value ? (e.target.value as EducationLevel) : '',
              )
            }
            className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
          >
            <option value="">Sélectionner un niveau</option>
            <option value="N/A">N/A</option>
            <option value="CERTIFICAT">Certificat</option>
            <option value="A3">A3</option>
            <option value="A2">A2</option>
            <option value="HUMANITE_INCOMPLETE">Humanités Incomplètes</option>
            <option value="DIPLOME_ETAT">Diplôme d&apos;État</option>
            <option value="GRADUE">Gradué</option>
            <option value="LICENCIE">Licencié</option>
            <option value="MASTER">Master</option>
            <option value="DOCTEUR">Docteur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Profession
          </label>
          <select
            name="profession"
            value={profession}
            onChange={(e) =>
              setProfession(
                e.target.value ? (e.target.value as Profession) : '',
              )
            }
            className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
          >
            <option value="">Sélectionner une profession</option>
            <option value="LIBERAL">Libéral</option>
            <option value="FONCTIONNAIRE">Fonctionnaire</option>
            <option value="AGENT_ONG">Agent ONG</option>
            <option value="SANS_EMPLOI">Sans Emploi</option>
          </select>
        </div>

        <Input
          name="competenceDomain"
          label="Compétence"
          value={competenceDomain}
          onChange={setCompetenceDomain}
          placeholder="Domaine de compétence"
        />
        <Input
          name="phoneNumber"
          label="Téléphone"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="Numéro de téléphone"
        />
        <Input
          name="whatsappNumber"
          label="WhatsApp"
          value={whatsappNumber}
          onChange={setWhatsappNumber}
          placeholder="Numéro WhatsApp"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Commune
          </label>
          <select
            name="commune"
            value={commune}
            onChange={(e) =>
              setCommune(e.target.value ? (e.target.value as Commune) : '')
            }
            className="mt-1 block w-full rounded-md border border-gray-500 px-4 py-1"
          >
            <option value="">Sélectionner une commune</option>
            <option value="GOMA">Goma</option>
            <option value="KARISIMBI">Karisimbi</option>
          </select>
        </div>
        <Input
          name="quarter"
          label="Quartier"
          value={quarter}
          onChange={setQuarter}
          placeholder="Quartier"
        />

        <Input
          name="reference"
          label="Référence"
          value={reference}
          onChange={setReference}
          placeholder="Référence"
        />

        <div className="col-span-2 md:col-span-1">
          <Input
            name="address"
            label="Adresse"
            value={address}
            onChange={setAddress}
            placeholder="Adresse"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Commissions
          </label>
          <Select<SelectOption<Commission>, true>
            isMulti
            name="commissions"
            value={commissions.map((commission) => ({
              value: commission,
              label: commission,
            }))}
            onChange={(selectedOptions) => {
              setCommissions(
                selectedOptions?.map((option) => option.value as Commission) ||
                  [],
              );
            }}
            options={Object.values(Commission).map((commission) => ({
              value: commission,
              label: commission,
            }))}
            className="mt-1 text-[10px]"
            classNamePrefix="react-select"
            placeholder="Sélectionner les commissions"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            Catégories
          </label>
          <Select<SelectOption<UserCategory>, true>
            isMulti
            name="categories"
            value={categories.map((category) => ({
              value: category,
              label: translateCategory(category),
            }))}
            onChange={(selectedOptions) => {
              setCategories(
                selectedOptions?.map(
                  (option) => option.value as UserCategory,
                ) || [],
              );
            }}
            options={categoryOptions}
            className="mt-1 text-[10px]"
            classNamePrefix="react-select"
            placeholder="Sélectionner les catégories"
          />
        </div>

        <button
          type="submit"
          className="col-span-2 w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:col-span-1"
        >
          Créer un membre
        </button>
      </form>
    </Popup>
  );
};

export default UserRegistration;
