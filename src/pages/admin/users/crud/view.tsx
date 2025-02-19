import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';

import { RegisterFingerprint } from '../user_actions';

interface User {
  id: number;
  name: string;
  surname: string;
  phoneNumber: string;
  matricule: string;
  key: string | null;
  created_at: string;
}

interface ViewUserProps {
  user: User | null;
  onClose: () => void;
}

const ViewUser: React.FC<ViewUserProps> = ({ user, onClose }) => {
  const [userData, setUserData] = useState<User | null>(user);
  const [isFingerprintRegistered, setIsFingerprintRegistered] = useState(false);

  useEffect(() => {
    setUserData(user);
    if (user?.key) {
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
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="font-semibold">Nom:</span>
          <span>{userData.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Prenom:</span>
          <span>{userData.surname}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Telephone:</span>
          <span>{userData.phoneNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Matricule:</span>
          <span>{userData.matricule}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Empreinte:</span>
          <span>{isFingerprintRegistered ? '✅' : '❌'}</span>
        </div>

        {!isFingerprintRegistered && (
          <button
            onClick={handleFingerprintRegistration}
            className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
          >
            Enregistrer l&apos;empreinte digitale
          </button>
        )}
      </div>
    </Popup>
  );
};

export default ViewUser;
