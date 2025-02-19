import React from 'react';

import Input from '@/components/input';
import Popup from '@/components/popup';

import { CreateUser } from '../user_actions';

interface CreateUserProps {
  onClose: () => void;
  onUserCreated: () => void;
}

const UserRegistration: React.FC<CreateUserProps> = ({
  onClose,
  onUserCreated,
}) => {
  const {
    name,
    surname,
    phoneNumber,
    setName,
    setSurname,
    setPhoneNumber,
    handleSubmit,
  } = CreateUser(onClose, onUserCreated);

  return (
    <Popup title="Register New User" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Input
            name={name}
            label="Name"
            placeholder=""
            onChange={(e: any) => setName(e)}
          />
        </div>

        <div className="mb-4">
          <Input
            name={surname}
            label="Surname"
            placeholder=""
            onChange={(e: any) => setSurname(e)}
          />
        </div>

        <div className="mb-4">
          <Input
            name={phoneNumber}
            label="Telephone"
            placeholder=""
            onChange={(e: any) => setPhoneNumber(e)}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Creer un nouveau membre
        </button>
      </form>
    </Popup>
  );
};

export default UserRegistration;
