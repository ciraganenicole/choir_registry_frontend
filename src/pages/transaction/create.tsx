import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';
import SelectInput from '@/components/selectInput';

import { FetchUsers } from '../admin/users/user_actions';
import { useCreateTransaction } from './logic';

interface CreateTransactionProps {
  onClose: () => void;
  onTransactionCreated: () => void;
}

const transactionCategories = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'CHARITY', label: 'Charity' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'TRANSPORT', label: 'Transport' },
];

// const subcategoriesMap: Record<string, { value: string; label: string }[]> = {
//   CHARITY: [
//     { value: 'ILLNESS', label: 'Illness' },
//     { value: 'BIRTH', label: 'Birth' },
//     { value: 'MARRIAGE', label: 'Marriage' },
//     { value: 'DEATH', label: 'Death' },
//   ],
//   MAINTENANCE: [
//     { value: 'MAINTENANCE', label: 'Maintenance' },
//     { value: 'BUY_DEVICES', label: 'Buy Devices' },
//   ],
//   TRANSPORT: [
//     { value: 'COMMITTEE', label: 'Committee' },
//     { value: 'SORTIE', label: 'Sortie' },
//   ],
// };

const CreateTransaction: React.FC<CreateTransactionProps> = ({
  onClose,
  onTransactionCreated,
}) => {
  const {
    amount,
    setFullname,
    setAmount,
    setCategory,
    setSubcategory,
    handleSubmit,
  } = useCreateTransaction(onClose, onTransactionCreated);

  const [formattedUsers, setFormattedUsers] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch users from backend
  useEffect(() => {
    const loadUsers = async () => {
      const usersData = await FetchUsers();

      // Map the users to the format expected by SelectInput
      const fUsers = usersData.map((user) => ({
        value: user.id.toString(),
        label: `${user.name} ${user.surname}`, // Combine name and surname
      }));
      setFormattedUsers(fUsers);
    };

    loadUsers();
  }, []);

  return (
    <Popup title="Create New Transaction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fullname (Search and Select) */}
        <SelectInput
          options={formattedUsers}
          onChange={setFullname}
          placeholder="Select Fullname"
          isMulti={false}
        />

        {/* Amount Input */}
        <input
          type="number"
          value={amount}
          onChange={(e: any) => setAmount(e)}
          placeholder="Enter Amount"
          className="w-full border p-2"
          required
        />

        {/* Category Selection */}
        <SelectInput
          options={transactionCategories}
          onChange={(selected) => {
            setCategory(selected);
            setSubcategory(''); // Reset subcategory when category changes
          }}
          placeholder="Select Category"
          isMulti={false}
        />

        {/* Subcategory (Conditional Display) */}
        {/* {category && subcategoriesMap[category.value] && (
          <SelectInput
            options={subcategoriesMap[category.value] || []}
            onChange={setSubcategory}
            placeholder="Select Subcategory"
            isMulti={false}
          />
        )} */}

        {/* Date Input */}
        {/* <input
          type="date"
          value={date}
          onChange={(e: any) => setDate(e)}
          className="border p-2 w-full"
          required
        /> */}

        <button type="submit" className="rounded bg-blue-500 p-2 text-white">
          Submit
        </button>
      </form>
    </Popup>
  );
};

export default CreateTransaction;
