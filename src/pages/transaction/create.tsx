import React, { useEffect, useState } from 'react';
import Select from 'react-select';

import Popup from '@/components/popup';

import { FetchUsers } from '../admin/users/user_actions';
import type { CreateTransactionDto, TransactionCategories } from './types';
import {
  Currency,
  ExpenseCategories,
  IncomeCategories,
  Subcategories,
  TransactionType,
} from './types';

interface CreateTransactionProps {
  onClose: () => void;
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
  defaultType?: TransactionType;
}

// Add phone number validation helper
const formatPhoneNumber = (phone: string) => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add '+' prefix if not present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Helper function to translate categories to French
const translateCategoryToFrench = (category: string): string => {
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

  return translations[category] || category;
};

export const CreateTransaction = ({
  onClose,
  onSubmit,
  defaultType = TransactionType.INCOME,
}: CreateTransactionProps) => {
  const [formData, setFormData] = useState<CreateTransactionDto>({
    amount: 0,
    type: defaultType,
    category: undefined,
    transactionDate: new Date(),
    currency: Currency.USD,
    contributorType: 'internal',
  });
  const [users, setUsers] = useState<Array<{ value: number; label: string }>>(
    [],
  );

  const availableCategories =
    formData.type === TransactionType.INCOME
      ? Object.values(IncomeCategories)
      : Object.values(ExpenseCategories);

  const availableSubcategories = formData.category
    ? Subcategories[
        formData.category as unknown as keyof typeof Subcategories
      ] || {}
    : {};

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await FetchUsers({ page: 1, limit: 100 });
        // Show all users in the dropdown
        const formattedUsers = response.data.map((user) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`,
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.amount || !formData.category || !formData.currency) {
      return;
    }

    // For expenses, validate that the selected user is a committee member
    if (formData.type === TransactionType.EXPENSE && formData.contributorId) {
      const selectedUser = users.find(
        (u) => u.value === formData.contributorId,
      );
      if (!selectedUser) {
        alert('Selectionner un membre');
        return;
      }
    }

    // For expenses, we only need committee members
    const transactionData: CreateTransactionDto = {
      ...formData,
      currency: formData.currency as Currency,
      contributorId:
        formData.type === TransactionType.EXPENSE
          ? formData.contributorId
          : undefined,
      externalContributorName:
        formData.type === TransactionType.INCOME
          ? formData.externalContributorName
          : undefined,
      externalContributorPhone:
        formData.type === TransactionType.INCOME
          ? formatPhoneNumber(formData.externalContributorPhone || '')
          : undefined,
    };

    await onSubmit(transactionData);
    onClose();
  };

  return (
    <Popup
      title={`Ajouter une transaction`}
      onClose={onClose}
      style="md:w-[50%]"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Montant
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700">
                Devise
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value as Currency,
                  })
                }
                required
              >
                <option value={Currency.USD}>USD</option>
                <option value={Currency.FC}>FC</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                value={formData.category || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as TransactionCategories,
                  })
                }
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {translateCategoryToFrench(category)}
                  </option>
                ))}
              </select>
            </div>
            {formData.category &&
              Object.keys(availableSubcategories).length > 0 && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Sous-catégorie
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                    value={formData.subcategory || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subcategory: e.target.value,
                      })
                    }
                  >
                    <option value="">Sélectionner une sous-catégorie</option>
                    {Object.values(
                      availableSubcategories as Record<string, string>,
                    ).map((subcategory: string) => (
                      <option key={subcategory} value={subcategory}>
                        {translateCategoryToFrench(subcategory)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              rows={3}
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={
                new Date(formData.transactionDate).toISOString().split('T')[0]
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transactionDate: new Date(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type de Contributeur
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.contributorType || 'internal'}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  contributorType: e.target.value as 'internal' | 'external',
                  contributorId:
                    e.target.value === 'external'
                      ? undefined
                      : formData.contributorId,
                  externalContributorName:
                    e.target.value === 'external' ? '' : undefined,
                  externalContributorPhone:
                    e.target.value === 'external' ? '' : undefined,
                });
              }}
            >
              <option value="internal">Interne</option>
              <option value="external">Externe</option>
            </select>
          </div>

          {formData.contributorType === 'internal' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contributeur
              </label>
              <Select
                options={users}
                value={users.find(
                  (user) => user.value === formData.contributorId,
                )}
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    contributorId: option?.value,
                  })
                }
                placeholder="Sélectionner un utilisateur"
                isClearable
                required
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom du Contributeur
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.externalContributorName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      externalContributorName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone du Contributeur (Optionnel)
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  value={formData.externalContributorPhone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      externalContributorPhone: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </Popup>
  );
};
