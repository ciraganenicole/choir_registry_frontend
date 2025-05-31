import React, { useEffect, useState } from 'react';

import Popup from '@/components/popup';
import { api } from '@/config/api';
import type { Transaction } from '@/lib/transaction/types';
import {
  Currency,
  ExpenseCategories,
  IncomeCategories,
  TransactionType,
} from '@/lib/transaction/types';
import type { User } from '@/lib/user/type';

interface UpdateTransactionProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: () => void;
}

const UpdateTransaction: React.FC<UpdateTransactionProps> = ({
  transaction,
  onClose,
  onUpdate,
}) => {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [currency, setCurrency] = useState(transaction.currency);
  const [type, setType] = useState(transaction.type);
  const [category, setCategory] = useState<
    IncomeCategories | ExpenseCategories
  >(transaction.category as IncomeCategories | ExpenseCategories);
  const [subcategory, setSubcategory] = useState(transaction.subcategory || '');
  const [transactionDate, setTransactionDate] = useState(
    transaction.transactionDate,
  );
  const [contributorId, setContributorId] = useState<number | null>(
    transaction.contributor?.id || null,
  );
  const [externalContributorName, setExternalContributorName] = useState(
    transaction.externalContributorName || '',
  );
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = {
        amount: parseFloat(amount),
        currency,
        type,
        category,
        subcategory: subcategory || null,
        transactionDate,
        contributorId: contributorId || null,
        externalContributorName: externalContributorName || null,
      };

      await api.put(`/transactions/${transaction.id}`, data);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Failed to update transaction');
    }
  };

  const categories =
    type === TransactionType.INCOME ? IncomeCategories : ExpenseCategories;

  // Get available subcategories based on the selected category
  const getSubcategories = (selectedCategory: string): string[] => {
    const subcategoriesMap = {
      [IncomeCategories.SPECIAL]: ['ILLNESS', 'BIRTH', 'MARRIAGE', 'DEATH'],
      [ExpenseCategories.SPECIAL_ASSISTANCE]: [
        'ILLNESS',
        'BIRTH',
        'MARRIAGE',
        'DEATH',
      ],
      [ExpenseCategories.MAINTENANCE]: ['BUY_DEVICES'],
      [ExpenseCategories.TRANSPORT]: ['COMMITTEE', 'SORTIE'],
    };

    return (
      subcategoriesMap[selectedCategory as keyof typeof subcategoriesMap] || []
    );
  };

  // Helper function to translate categories to French
  const translateCategory = (cat: string): string => {
    const translations: Record<string, string> = {
      // Income categories
      DAILY: 'Quotidien',
      SPECIAL: 'Spécial',
      DONATION: 'Donation',
      OTHER: 'Autre',
      // Expense categories
      CHARITY: 'Charité',
      MAINTENANCE: 'Maintenance',
      TRANSPORT: 'Transport',
      SPECIAL_ASSISTANCE: 'Assistance Spéciale',
      COMMUNICATION: 'Communication',
      RESTAURATION: 'Restauration',
      // Subcategories
      ILLNESS: 'Maladie',
      BIRTH: 'Naissance',
      MARRIAGE: 'Mariage',
      DEATH: 'Décès',
      BUY_DEVICES: "Achat d'Équipements",
      COMMITTEE: 'Comité',
      SORTIE: 'Sortie',
    };
    return translations[cat] || cat;
  };

  return (
    <Popup title="Modifier la transaction" onClose={onClose} style="md:w-[50%]">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value={TransactionType.INCOME}>Revenu</option>
            <option value={TransactionType.EXPENSE}>Dépense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value as IncomeCategories | ExpenseCategories,
              )
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {Object.values(categories).map((cat) => (
              <option key={cat} value={cat}>
                {translateCategory(cat)}
              </option>
            ))}
          </select>
        </div>

        {getSubcategories(category).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sous-catégorie
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Sélectionner une sous-catégorie</option>
              {getSubcategories(category).map((subcat) => (
                <option key={subcat} value={subcat}>
                  {translateCategory(subcat)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Montant
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Devise
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value={Currency.USD}>USD</option>
            <option value={Currency.FC}>FC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={transactionDate.split('T')[0]}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contributeur
          </label>
          <select
            value={contributorId || ''}
            onChange={(e) => {
              const { value } = e.target;
              setContributorId(value ? parseInt(value, 10) : null);
              if (value) setExternalContributorName('');
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Sélectionner un contributeur</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.lastName} {user.firstName}
              </option>
            ))}
          </select>
        </div>

        {!contributorId && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom du contributeur externe
            </label>
            <input
              type="text"
              value={externalContributorName}
              onChange={(e) => setExternalContributorName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Nom du contributeur externe"
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Mettre à jour
          </button>
        </div>
      </form>
    </Popup>
  );
};

export default UpdateTransaction;
