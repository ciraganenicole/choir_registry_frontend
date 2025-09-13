import React, { useEffect, useState } from 'react';
import Select from 'react-select';

import Popup from '@/components/popup';
import type {
  CreateTransactionDto,
  TransactionCategories,
} from '@/lib/transaction/types';
import {
  Currency,
  ExpenseCategories,
  IncomeCategories,
  Subcategories,
  TransactionType,
} from '@/lib/transaction/types';
import { FetchUsers } from '@/lib/user/user_actions';

interface CreateTransactionProps {
  onClose: () => void;
  onSubmit: (data: CreateTransactionDto) => Promise<void>;
  defaultType?: TransactionType;
}

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

interface FormError {
  message?: string;
}

interface FormErrors {
  amount?: FormError;
  submit?: FormError;
}

export const CreateTransaction = ({
  onClose,
  onSubmit,
  defaultType = TransactionType.INCOME,
}: CreateTransactionProps) => {
  const todayString = new Date().toLocaleDateString('en-CA');
  const [formData, setFormData] = useState<
    Omit<CreateTransactionDto, 'transactionDate'> & { transactionDate: string }
  >({
    amount: 0,
    type: defaultType,
    category: IncomeCategories.DAILY,
    currency: Currency.FC,
    contributorType: 'internal',
    contributorId: undefined,
    externalContributorName: undefined,
    externalContributorPhone: undefined,
    transactionDate: todayString,
  });
  const [users, setUsers] = useState<Array<{ value: number; label: string }>>(
    [],
  );
  const [errors, setErrors] = useState<FormErrors>({});

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
        const response = await FetchUsers({ page: 1, limit: 200 });
        // Show all users in the dropdown
        const formattedUsers = response.data.map((user) => ({
          value: user.id,
          label: `${user.lastName} ${user.firstName}`,
        }));
        setUsers(formattedUsers);
      } catch (error) {
        // Silently ignore user fetch errors - form will work without user list
        console.warn('Failed to fetch users for transaction form:', error);
      }
    };
    loadUsers();
  }, [formData.type]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    try {
      if (!formData.amount || formData.amount <= 0) {
        setErrors({
          amount: { message: 'Le montant doit être supérieur à 0' },
        });
        return;
      }

      if (
        formData.externalContributorPhone &&
        !/^0\d{9}$/.test(formData.externalContributorPhone.trim())
      ) {
        setErrors((prev) => ({
          ...prev,
          externalContributorPhone:
            'Le numéro doit comporter exactement 10 chiffres et commencer par 0',
        }));
        return;
      }

      // The date is already in YYYY-MM-DD format, no need to convert
      await onSubmit({
        ...formData,
        transactionDate: formData.transactionDate,
      });

      // Reset form data with a new date
      setFormData({
        ...formData,
        amount: 0,
        type: defaultType,
        category: IncomeCategories.DAILY,
        currency: Currency.FC,
        contributorType: 'internal',
        contributorId: undefined,
        externalContributorName: undefined,
        externalContributorPhone: undefined,
        transactionDate: todayString,
      });

      // Clear errors
      setErrors({});
    } catch (error) {
      setErrors({
        submit: { message: 'Une erreur est survenue lors de la soumission' },
      });
    }
  };

  return (
    <Popup
      title={`Ajouter une transaction`}
      onClose={onClose}
      style="md:w-[50%]"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-2">
          {errors.submit && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
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
                  <p className="text-sm font-medium text-red-800">
                    {errors.submit.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Montant
              </label>
              <input
                type="number"
                className={`mt-1 block w-full rounded-md border ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                } p-2`}
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                required
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
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

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Catégorie
            </label>
            <Select<{ value: TransactionCategories; label: string }>
              value={
                formData.category
                  ? {
                      value: formData.category,
                      label: translateCategoryToFrench(formData.category),
                    }
                  : null
              }
              onChange={(newValue) =>
                setFormData({
                  ...formData,
                  category: newValue?.value,
                })
              }
              options={availableCategories.map((category) => ({
                value: category,
                label: translateCategoryToFrench(category),
              }))}
              className="mt-1"
              classNamePrefix="react-select"
              placeholder="Sélectionner une catégorie"
              noOptionsMessage={() => 'Aucune catégorie disponible'}
            />
          </div>

          {Object.keys(availableSubcategories).length > 0 && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Sous-catégorie
              </label>
              <Select<{ value: string; label: string }>
                value={
                  formData.subcategory
                    ? {
                        value: formData.subcategory,
                        label: translateCategoryToFrench(formData.subcategory),
                      }
                    : null
                }
                onChange={(newValue) =>
                  setFormData({
                    ...formData,
                    subcategory: newValue?.value,
                  })
                }
                options={Object.values(
                  availableSubcategories as Record<string, string>,
                ).map((subcategory: string) => ({
                  value: subcategory,
                  label: translateCategoryToFrench(subcategory),
                }))}
                className="mt-1"
                classNamePrefix="react-select"
                placeholder="Sélectionner une sous-catégorie"
                noOptionsMessage={() => 'Aucune sous-catégorie disponible'}
                isClearable
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.transactionDate || todayString}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  transactionDate:
                    typeof e.target.value === 'string' &&
                    e.target.value.length > 0
                      ? e.target.value
                      : todayString,
                })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {formData.type === TransactionType.EXPENSE
                ? 'Type de Bénéficiaire'
                : 'Type de Contributeur'}
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
              <option value="external">Autre</option>
            </select>
          </div>

          {formData.contributorType === 'internal' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {formData.type === TransactionType.EXPENSE
                  ? 'Bénéficiaire'
                  : 'Contributeur'}
              </label>
              <Select
                options={users}
                value={users.find(
                  (user) => user.value === formData.contributorId,
                )}
                onChange={(option) =>
                  setFormData({
                    ...formData,
                    contributorId: option?.value || null,
                  })
                }
                placeholder="Sélectionner un utilisateur"
                isClearable
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {formData.type === TransactionType.EXPENSE
                    ? 'Nom du Bénéficiaire'
                    : 'Nom du Contributeur'}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {formData.type === TransactionType.EXPENSE
                    ? 'Téléphone du Bénéficiaire (Optionnel)'
                    : 'Téléphone du Contributeur (Optionnel)'}
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

export default CreateTransaction;
