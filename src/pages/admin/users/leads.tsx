import { jsPDF as JSPDF } from 'jspdf';
import type { CellHookData } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { HiDownload } from 'react-icons/hi';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import LeadCredentialsPopup from '@/components/LeadCredentialsPopup';
import Pagination from '@/components/pagination';
import { useAuth } from '@/providers/AuthProvider';

import { canUpdateUsers } from '../../../lib/user/permissions';
import {
  type User,
  UserCategory,
  type UserFilters,
} from '../../../lib/user/type';
import { FetchUsers } from '../../../lib/user/user_actions';
import DeleteUser from './crud/delete';
import UpdateUser from './crud/update';
import ViewUser from './crud/view';

const generatePassword = (lastName: string, createdAt: string): string => {
  const creationYear = new Date(createdAt).getFullYear();
  return `${lastName.toLowerCase()}${creationYear}`;
};

const handleError = (error: unknown, setError: (msg: string) => void) => {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('An unexpected error occurred');
  }
};

const LeadsManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopupViewOpen, setIsPopupViewOpen] = useState(false);
  const [isPopupUpdateOpen, setIsPopupUpdateOpen] = useState(false);
  const [isPopupDeleteOpen, setIsPopupDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLeadCredentials, setShowLeadCredentials] = useState(false);
  const [leadCredentials, setLeadCredentials] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filters: UserFilters = {
    page: currentPage,
    limit: 10,
    search: searchQuery,
    category: UserCategory.LEAD,
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await FetchUsers(filters);
      setLeads(result.data);
      setTotalLeads(result.total);
    } catch (err) {
      handleError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [currentPage, searchQuery]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsPopupViewOpen(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === updatedUser.id ? updatedUser : lead,
      ),
    );
    setIsPopupUpdateOpen(false);
  };

  const handleDeleteConfirmed = (userId: number) => {
    setLeads((prevLeads) => prevLeads.filter((lead) => lead.id !== userId));
    setIsPopupDeleteOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const exportLeads = async () => {
    try {
      const doc = new JSPDF();

      doc.setFontSize(18);
      doc.text('Liste des Utilisateurs LEAD', 14, 22);
      doc.setFontSize(12);
      doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

      const tableData = leads.map((lead, index) => [
        index + 1,
        `${lead.lastName} ${lead.firstName}`,
        lead.phoneNumber || '-',
        lead.email || '-',
      ]);

      const headers = ['#', 'Noms', 'Téléphone', 'Email'];

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [75, 85, 99],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 15 }, // #
          1: { cellWidth: 50 }, // Noms
          2: { cellWidth: 35 }, // Téléphone
          3: { cellWidth: 45 }, // Email
        },
        didDrawCell: (data: CellHookData) => {
          if (data.section === 'head' || data.section === 'body') {
            doc.setDrawColor(200, 200, 200);
            doc.line(
              data.cell.x,
              data.cell.y,
              data.cell.x + data.cell.width,
              data.cell.y,
            );
            doc.line(
              data.cell.x,
              data.cell.y,
              data.cell.x,
              data.cell.y + data.cell.height,
            );
          }
        },
      });

      doc.save('liste-utilisateurs-lead.pdf');
    } catch (exportError) {
      setErrorMessage("Erreur lors de l'exportation");
    }
  };

  const renderActionButtons = (viewedUser: User, isMobile = false) => {
    const iconClasses = 'h-4 w-4';
    const buttonClasses = {
      view: 'text-blue-500 hover:bg-blue-50',
      delete: 'text-red-500 hover:bg-red-50',
    };

    if (isMobile) {
      return (
        <div className="mt-4 flex flex-wrap gap-2">
          {canUpdateUsers(currentUser?.role) && (
            <button
              onClick={() => handleView(viewedUser)}
              className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100"
            >
              <FaEye className={iconClasses} />
              Voir
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {canUpdateUsers(currentUser?.role) && (
          <button
            onClick={() => handleView(viewedUser)}
            className={buttonClasses.view}
            title="Voir"
          >
            <FaEye className={iconClasses} />
          </button>
        )}
      </div>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="text-red-800">Erreur: {error}</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Liste des conducteurs</h1>
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <SearchInput onSearch={handleSearch} />
            <button
              onClick={exportLeads}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              <HiDownload className="size-4" />
              <span className="hidden md:block">Export</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-4">
            <div className="text-red-800">{errorMessage}</div>
          </div>
        )}

        <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-500 text-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  #
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Noms
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Téléphone
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Mot de passe
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads && leads.length > 0 ? (
                leads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {(currentPage - 1) * filters.limit! + index + 1}
                    </td>
                    <td className="flex flex-col gap-1 px-4 py-3 font-semibold">
                      {lead.lastName} {lead.firstName}
                      <span className="text-xs text-gray-700">
                        {lead.categories && lead.categories.length > 0 ? (
                          lead.categories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full bg-purple-100 px-3 py-1 text-[10px] text-purple-800"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Normal</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">{lead.phoneNumber || '-'}</td>
                    <td className="px-4 py-3">{lead.email || '-'}</td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {generatePassword(lead.lastName, lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {renderActionButtons(lead, false)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center">
                    Aucun conducteur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {leads && leads.length > 0 ? (
            leads.map((lead, index) => (
              <div
                key={lead.id}
                className="overflow-hidden rounded-lg bg-white shadow"
              >
                <div className="p-4">
                  <div className="flex flex-row items-center justify-between">
                    <p className="text-sm text-gray-500">
                      #{(currentPage - 1) * filters.limit! + index + 1}
                    </p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {lead.matricule}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center gap-4">
                    <div className="">
                      <h3 className="text-lg font-medium">
                        {lead.lastName} {lead.firstName}
                      </h3>
                      <span className="text-xs text-gray-700">
                        {lead.categories && lead.categories.length > 0 ? (
                          lead.categories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                            >
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Normal</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Téléphone:</span>
                      <span>{lead.phoneNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="truncate">{lead.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mot de passe:</span>
                      <span className="font-mono">
                        {generatePassword(lead.lastName, lead.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="my-2 h-[1px] w-full bg-gray-500" />

                  {renderActionButtons(lead, true)}
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">Aucun conducteur trouvé.</div>
          )}
        </div>

        <div className="mt-6">
          <Pagination
            totalPages={Math.ceil(totalLeads / filters.limit!)}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {isPopupViewOpen && (
        <ViewUser
          onClose={() => setIsPopupViewOpen(false)}
          user={selectedUser}
          transactions={[]}
        />
      )}
      {isPopupUpdateOpen && selectedUser && (
        <UpdateUser
          onClose={() => setIsPopupUpdateOpen(false)}
          onUpdate={handleUpdateUser}
          user={selectedUser}
        />
      )}
      {isPopupDeleteOpen && (
        <DeleteUser
          onClose={() => setIsPopupDeleteOpen(false)}
          onUserDeleted={handleDeleteConfirmed}
          selectedUser={selectedUser}
        />
      )}

      <LeadCredentialsPopup
        isOpen={showLeadCredentials}
        onClose={() => {
          setShowLeadCredentials(false);
          setLeadCredentials(null);
        }}
        userData={leadCredentials}
      />
    </Layout>
  );
};

export default LeadsManagement;
