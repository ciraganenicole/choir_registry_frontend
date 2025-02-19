import React from 'react';

import Popup from '@/components/popup';

import type { User } from '../type';
import { DeleteUserAction } from '../user_actions';

interface DeleteProps {
  onClose: () => void;
  selectedUser: User | null;
  onUserDeleted: (userId: number) => void;
}

const DeleteUser: React.FC<DeleteProps> = ({
  onClose,
  selectedUser,
  onUserDeleted,
}) => {
  const confirmDelete = async () => {
    if (selectedUser) {
      const isDeleted = await DeleteUserAction(selectedUser.id);
      if (isDeleted) {
        onUserDeleted(selectedUser.id);
      }
      onClose();
    }
  };

  return (
    <Popup title="Confirm Deletion" onClose={onClose}>
      <p className="mb-4 text-center text-[16px]">
        Êtes-vous sûr de vouloir supprimer{' '}
        <strong className="text-[18px]">
          {selectedUser?.name} {selectedUser?.surname}
        </strong>{' '}
        ?<br />
        Cette action est irréversible.
      </p>

      <div className="flex justify-center gap-4">
        <button
          onClick={onClose}
          className="w-[100px] rounded-md bg-blue-700 px-4 py-1 text-[14px] font-semibold text-white hover:bg-blue-600"
        >
          Annuler
        </button>
        <button
          onClick={confirmDelete}
          className="w-[100px] rounded-md bg-red-700 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-600"
        >
          Supprimer
        </button>
      </div>
    </Popup>
  );
};

export default DeleteUser;
