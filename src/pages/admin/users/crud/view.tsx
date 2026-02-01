import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';
import { logger } from '@/utils/logger';

import type { User } from '../../../../lib/user/type';
import { RegisterFingerprint } from '../../../../lib/user/user_actions';

// Add translation function for categories
export const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    NEWCOMER: 'ADHERANT',
    WORSHIPPER: 'LOUADO',
    COMMITTEE: 'COMITE',
    NORMAL: 'NORMAL',
    LEAD: 'LEAD',
    MUSICIAN: 'MUSICIEN',
  };
  return translations[category] || category;
};

interface ViewUserProps {
  user: User | null;
  transactions: Array<{ id: string; description: string; amount: number }>;
  onClose: () => void;
}

const ViewUser: React.FC<ViewUserProps> = ({ user, transactions, onClose }) => {
  const [userData] = useState<User>(user as User);
  const [isFingerprintRegistered, setIsFingerprintRegistered] = useState(false);

  useEffect(() => {
    if (user?.fingerprintData) {
      setIsFingerprintRegistered(true);
    }
  }, [user]);

  const handleFingerprintRegistration = async () => {
    if (userData) {
      const success = await RegisterFingerprint(userData.id);
      if (success) {
        setIsFingerprintRegistered(true);
      } else {
        logger.error('Fingerprint registration failed');
      }
    }
  };

  if (!userData) return null;

  return (
    <Popup title="Details du membre" onClose={onClose}>
      <div className="flex flex-col gap-3 md:flex-row md:gap-6">
        {/* Left Section - Profile */}
        <div className="w-full space-y-3 md:space-y-6 lg:w-1/2">
          {/* Header with Name and Matricule */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 md:text-2xl">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="mt-1 text-[12px] text-gray-600 md:text-[16px]">
                  {userData.email || 'Aucun email'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-500">Matricule</span>
                <span className="font-semibold text-gray-900">
                  {userData.matricule}
                </span>
              </div>
            </div>

            {/* Status and Profile Picture */}
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-center gap-2">
                <div className="h-[1px] flex-1 bg-gray-200" />
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    userData.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {userData.isActive ? 'Actif(ve)' : 'Inactif(ve)'}
                </span>
                <div className="h-[1px] flex-1 bg-gray-200" />
              </div>
              <div className="flex justify-center">
                <img
                  src="/default-profile.jpg"
                  alt="photo"
                  className="size-32 rounded-full border-2 border-gray-500 object-cover text-center shadow-sm"
                />
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-500">Genre</p>
                <p className="font-medium">
                  {userData.gender || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">État Civil</p>
                <p className="font-medium">
                  {userData.maritalStatus || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Niveau d&apos;Études</p>
                <p className="font-medium">
                  {userData.educationLevel || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Profession</p>
                <p className="font-medium">
                  {userData.profession || 'Non spécifié'}
                </p>
              </div>
            </div>

            {/* Fingerprint Section */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <span className="text-gray-600">Empreinte digitale</span>
              {isFingerprintRegistered ? (
                <span className="flex items-center gap-2 font-medium text-green-600">
                  Enregistrée ✓
                </span>
              ) : (
                <button
                  onClick={handleFingerprintRegistration}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Details and Transactions */}
        <div className="w-full space-y-6 lg:w-1/2">
          {/* Contact and Location Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">
              Informations détaillées
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-gray-500">Téléphone</p>
                <p className="font-medium">
                  {userData.phoneNumber || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">WhatsApp</p>
                <p className="font-medium">
                  {userData.whatsappNumber || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Commune</p>
                <p className="font-medium">
                  {userData.commune || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Quartier</p>
                <p className="font-medium">
                  {userData.quarter || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Église d&apos;origine</p>
                <p className="font-medium">
                  {userData.churchOfOrigin || 'Non spécifié'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Date d&apos;adhésion</p>
                <p className="font-medium">
                  {userData.joinDate
                    ? new Date(userData.joinDate).toLocaleDateString('fr-FR')
                    : 'Non spécifié'}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-gray-500">Adresse</p>
                <p className="font-medium">
                  {userData.address || 'Non spécifié'}
                </p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-gray-500">Référence</p>
                <p className="font-medium">
                  {userData.reference || 'Non spécifié'}
                </p>
              </div>
            </div>
          </div>

          {/* Commissions and Categories */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Affiliations</h3>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-gray-500">Commissions</p>
                <div className="flex flex-wrap gap-2">
                  {userData.commissions && userData.commissions.length > 0 ? (
                    userData.commissions.map((commission) => (
                      <span
                        key={commission}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {commission}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      Aucune commission
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-gray-500">Catégories</p>
                <div className="flex flex-wrap gap-2">
                  {userData.categories && userData.categories.length > 0 ? (
                    userData.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                      >
                        {translateCategory(category)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Normal</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          {transactions.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">
                Transactions récentes
              </h3>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <span className="text-gray-700">
                      {transaction.description}
                    </span>
                    <span
                      className={`font-medium ${
                        transaction.amount >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.amount.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default ViewUser;
