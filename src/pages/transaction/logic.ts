import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

import { TransactionCategories } from '@/utils/transaction';

const API_BASE_URL = 'http://localhost:4000';

// Helper to determine transaction type
export const getTransactionType = (
  category: TransactionCategories,
): 'INCOME' | 'EXPENSE' => {
  const IncomeCategories = [
    TransactionCategories.DAILY,
    TransactionCategories.SPECIAL,
    TransactionCategories.DONATION,
    TransactionCategories.OTHER,
  ];

  return IncomeCategories.includes(category) ? 'INCOME' : 'EXPENSE';
};

// const fetchTransactions = async (filters: {
//   fullname?: string;
//   date?: string;
//   amount?: number;
// }) => {
//   const queryParams = buildQueryParams(filters);
//   const { data } = await axios.get(`${API_BASE_URL}/transactions?`, {paramsarams});
//   console.log('Data:', data);

//   return data.map((transaction: any) => ({
//     ...transaction,
//     type: getTransactionType(transaction.category),
//   }));
// };

// export const useTransactions = (filters: {  date?: string; amount?: number, fullname?: string, category?: string, subcategory?: string }) => {
//   return useQuery({
//     queryKey: ['transactions', filters],
//     queryFn: () => fetchTransactions(filters),
//   });
// };

export const fetchTransactions = async (params: any) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transactions`, {
      params,
    });
    return response.data.map((transaction: any) => ({
      ...transaction,
      type: getTransactionType(transaction.category),
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

const createTransaction = async (transaction: any) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/transactions`,
    transaction,
  );
  return data;
};

export const useCreateTransaction = (
  onClose: () => void,
  onTransactionCreated: () => void,
) => {
  const queryClient = useQueryClient();
  const [fullname, setFullname] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<TransactionCategories | ''>('');
  const [subcategory, setSubcategory] = useState('');

  const { mutate } = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      onClose();
      onTransactionCreated();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transactionData = { fullname, amount, category, subcategory };

    try {
      mutate(transactionData);
      setFullname('');
      setAmount(0);
      setCategory('');
      setSubcategory('');
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  return {
    fullname,
    amount,
    category,
    subcategory,
    setFullname,
    setAmount,
    setCategory,
    setSubcategory,
    handleSubmit,
  };
};

// Custom hook to add a new transaction
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
