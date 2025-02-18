import React, { useEffect, useState } from 'react';

import RegisterFingerprint from './register_fingerprint';

interface User {
  id: number;
  name: string;
  surname: string;
  phoneNumber: string;
  matricule: string;
  key: string | null; // This is the fingerprint public key
  created_at: string;
}

interface ViewUserProps {
  user: User | null;
}

const ViewUser: React.FC<ViewUserProps> = ({ user }) => {
  const [userData, setUserData] = useState<User | null>(user);
  const [isFingerprintRegistered, setIsFingerprintRegistered] = useState(false);

  useEffect(() => {
    setUserData(user);
    if (user?.key) {
      setIsFingerprintRegistered(true);
    }
  }, [user]);

  if (!userData) return null;

  return (
    <div className="bg-opacity/50 fixed inset-0 z-50 flex items-center justify-center bg-gray-800">
      <div className="w-1/3 rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-4 text-xl font-bold">User Details</h2>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-semibold">Name:</span>
            <span>{userData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Surname:</span>
            <span>{userData.surname}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Phone:</span>
            <span>{userData.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Matricule:</span>
            <span>{userData.matricule}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Created At:</span>
            <span>{userData.created_at}</span>
          </div>

          {/* Fingerprint Registration Section */}
          {!isFingerprintRegistered && (
            <div className="mt-4">
              <RegisterFingerprint userId={userData.id} />
            </div>
          )}

          {isFingerprintRegistered && (
            <p className="mt-4 font-semibold text-green-500">
              Fingerprint already registered.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewUser;
