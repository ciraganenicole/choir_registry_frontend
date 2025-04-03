import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';

import type { User } from '../type';
import { RegisterFingerprint } from '../user_actions';

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
        console.error('Fingerprint registration failed');
      }
    }
  };

  if (!userData) return null;

  return (
    <Popup title="User Details" onClose={onClose}>
      <div className="flex size-full flex-row gap-4">
        <div className="flex h-full w-[50%] flex-col space-y-4 rounded-md border-[1px] border-gray-300 p-4">
          <div className="">
            <div className="flex flex-row items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {userData.firstName} {userData.lastName}
              </h2>
              <span>{userData.matricule}</span>
            </div>
            <div className="flex flex-row items-center justify-between">
              <p className="text-gray-600">{userData.email || 'No mail'}</p>
              <span>{userData.gender}</span>
            </div>
          </div>
          <div>
            <div className="flex flex-row items-center gap-2">
              <div className="h-[1px] w-[40%] bg-gray-400" />
              <span className="text-center text-green-500">
                {userData.isActive ? 'Actif (ve)' : 'Inactif (ve)'}
              </span>
              <div className="h-[1px] w-[40%] bg-gray-400" />
            </div>
            <img
              src={userData.profilePicture || '/default-profile.jpg'}
              alt={`${userData.firstName} ${userData.lastName}`}
              className="m-auto mt-4 size-48 rounded-2xl object-cover"
            />
          </div>
          <div className="my-2 flex flex-row items-center justify-between text-[14px] font-semibold text-gray-700">
            <span>{userData.educationLevel}</span>
            <span>{userData.profession}</span>
            <span>{userData.maritalStatus}</span>
          </div>

          <span>
            Empreinte:{' '}
            {isFingerprintRegistered ? (
              '✅'
            ) : (
              <button
                onClick={handleFingerprintRegistration}
                className="ml-2 rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
              >
                Register Fingerprint
              </button>
            )}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex h-full w-[50%] flex-col items-center space-y-4 rounded-md border-[1px] border-gray-300">
          <span>{userData.educationLevel}</span>
          <span>{userData.profession}</span>
          <span>{userData.competenceDomain || 'N/A'}</span>
          <span>{userData.churchOfOrigin}</span>
          <span>{userData.commune}</span>
          <span>{userData.quarter}</span>
          <span>{userData.reference}</span>
          <span>{userData.address}</span>
          {/* <span>{userData.address}</span>
          <span>{userData.phoneNumber}</span>
          <span>{userData.whatsappNumber || 'N/A'}</span>
          <span>{userData.matricule}</span>
          <span>{userData.commissions.join(', ') || 'None'}</span>
          <span>{userData.categories.join(', ') || 'None'}</span> */}
          <span>
            {userData.joinDate
              ? new Date(userData.joinDate).toLocaleDateString()
              : 'No date'}
          </span>

          <div className="mt-4">
            <h3 className="text-lg font-medium">Transaction Details</h3>
            <ul className="list-disc pl-5">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="text-gray-700">
                  {transaction.description} - ${transaction.amount.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default ViewUser;
