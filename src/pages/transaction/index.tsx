import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';

import TransactionFilters from './filters';
import { getTransactionType } from './logic';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);

  // useEffect(() => {
  //   const loadTransactions = async (user: User) => {
  //     if (user) {
  //       const params = {
  //         // userId: user.id,
  //         // fullname: user.name,
  //         // amount: filterAmount,
  //         // category: filterCategory,
  //         // subcategory: filterSubcategory,
  //         // dateFrom: filterDateFrom,
  //         // dateTo: filterDateTo,
  //       };
  //       const transactionsData = await fetchTransactions(params);
  //       setTransactions(transactionsData);
  //     }
  //   };

  //   if (user) {
  //     loadTransactions(user); // Ensure user is provided
  //   }
  // }, [user, filterAmount, filterCategory, filterSubcategory, filterDateFrom, filterDateTo]);

  // const handleSearch = (query: string) => setSearchQuery(query);

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between py-4">
          <h2 className="text-xl font-semibold md:text-2xl">Registre</h2>
          <SearchInput onSearch={() => console.log(setTransactions)} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <h2 className="text-2xl font-semibold">$4,250.25</h2>
              <p className="text-sm text-green-500">+2.15% From last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-gray-500">Total Income</p>
              <h2 className="text-2xl font-semibold">$4,250.25</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-500">+4.12% From last month</p>
                <button className="rounded-sm bg-gray-900 p-1">
                  <FaPlus className="size-2 text-white" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <h2 className="text-2xl font-semibold">$4,250.25</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-500">-1.20% From last month</p>
                <button className="rounded-sm bg-gray-900 p-1">
                  <FaPlus className="size-2 text-white" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="text-sm text-gray-500">Total Daily Income</p>
              <h2 className="text-2xl font-semibold">$4,250.25</h2>
              <p className="text-sm text-green-500">January</p>
            </CardContent>
          </Card>
        </div>

        <TransactionFilters />

        <div className="mb-4 hidden rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm md:block">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-md border p-2">Fullname</th>
                <th className="px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Category</th>
                <th className="px-4 py-2">Subcategory</th>
                <th className="rounded-tr-md border p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((t: any) => {
                const transactionType = getTransactionType(t.category);
                const amountColor =
                  transactionType === 'INCOME'
                    ? 'text-green-600'
                    : 'text-red-600';

                return (
                  <tr key={t.id} className="border border-gray-500">
                    <td className="border border-gray-500 px-4 py-3">
                      {t.fullname}
                    </td>
                    <td className={`px-4 py-2 ${amountColor}`}>${t.amount}</td>
                    <td className="border border-gray-500 px-4 py-3">
                      {t.category}
                    </td>
                    <td className="px-4 py-2">{t.subcategory}</td>
                    <td className="border border-gray-500 px-4 py-3">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Transactions;
