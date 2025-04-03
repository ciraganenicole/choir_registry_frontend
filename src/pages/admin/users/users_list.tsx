import ExcelJS from 'exceljs';
import React, { useEffect, useState } from 'react';
import { FaEdit, FaEye, FaFilter, FaPlus, FaTrash } from 'react-icons/fa';
import { HiDownload } from 'react-icons/hi';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';

import UserRegistration from './crud/create';
import DeleteUser from './crud/delete';
import UpdateUser from './crud/update';
import ViewUser from './crud/view';
import {
  Commission,
  Commune,
  EducationLevel,
  Gender,
  Profession,
  type User,
  UserCategory,
  type UserFilters,
} from './type';
import { FetchUsers } from './user_actions';

// Translation functions
const translateGender = (gender: string): string => {
  const translations: Record<string, string> = {
    MALE: 'Masculin',
    FEMALE: 'Féminin',
  };
  return translations[gender] || gender;
};

const translateMaritalStatus = (status: string): string => {
  const translations: Record<string, string> = {
    SINGLE: 'Célibataire',
    MARRIED: 'Marié(e)',
    DIVORCED: 'Divorcé(e)',
    WIDOWED: 'Veuf/Veuve',
  };
  return translations[status] || status;
};

const translateEducationLevel = (level: string): string => {
  const translations: Record<string, string> = {
    PRIMARY: 'Primaire',
    SECONDARY: 'Secondaire',
    UNIVERSITY: 'Universitaire',
    GRADUATE: 'Gradué',
    PHD: 'Doctorat',
  };
  return translations[level] || level;
};

const translateProfession = (profession: string): string => {
  const translations: Record<string, string> = {
    STUDENT: 'Étudiant(e)',
    EMPLOYEE: 'Employé(e)',
    TEACHER: 'Enseignant(e)',
    DOCTOR: 'Médecin',
    ENGINEER: 'Ingénieur',
    OTHER: 'Autre',
  };
  return translations[profession] || profession;
};

const translateCommune = (commune: string): string => {
  const translations: Record<string, string> = {
    KINSHASA: 'Kinshasa',
    LUBUMBASHI: 'Lubumbashi',
    MBUJI_MAYI: 'Mbuji-Mayi',
    KANANGA: 'Kananga',
    KISANGANI: 'Kisangani',
    BUKAVU: 'Bukavu',
    GOMA: 'Goma',
    MATADI: 'Matadi',
    BOMA: 'Boma',
    KIKWIT: 'Kikwit',
  };
  return translations[commune] || commune;
};

const translateCommission = (commission: string): string => {
  const translations: Record<string, string> = {
    WORSHIP: 'Adoration',
    EVANGELISM: 'Évangélisation',
    YOUTH: 'Jeunesse',
    CHILDREN: 'Enfants',
    WOMEN: 'Femmes',
    MEN: 'Hommes',
    FINANCE: 'Finance',
    ADMINISTRATION: 'Administration',
    TECHNICAL: 'Technique',
    OTHER: 'Autre',
  };
  return translations[commission] || commission;
};

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPopupViewOpen, setIsPopupViewOpen] = useState(false);
  const [isPopupUpdateOpen, setIsPopupUpdateOpen] = useState(false);
  const [isPopupDeleteOpen, setIsPopupDeleteOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 8,
    sortBy: 'firstName',
    order: 'ASC',
  });

  const loadUsers = async () => {
    const response = await FetchUsers({ ...filters, page: currentPage });
    setUsers(response.data);
    setTotalUsers(response.total);
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsPopupViewOpen(true);
  };

  const handleUpdate = (user: User) => {
    setSelectedUser(user);
    setIsPopupUpdateOpen(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
      ),
    );
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsPopupDeleteOpen(true);
  };

  const handleDeleteConfirmed = (userId: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
    setCurrentPage(1);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    filterKey: keyof UserFilters,
  ) => {
    const { value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value === '' ? undefined : value,
      page: 1,
      limit: 8,
    }));
    setCurrentPage(1);
  };

  const exportUsers = async () => {
    try {
      const allUsers = await FetchUsers({ ...filters, limit: totalUsers });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      // Add organization header
      worksheet.mergeCells('A1:P1');
      const orgCell = worksheet.getCell('A1');
      orgCell.value = 'REGISTRE DE CHORALE';
      orgCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: '000000' },
      };
      orgCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      worksheet.getRow(1).height = 30;

      // Add report title with date
      worksheet.mergeCells('A2:P2');
      const titleCell = worksheet.getCell('A2');
      titleCell.value = `Liste des Utilisateurs - ${new Date().toLocaleDateString(
        'fr-FR',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}`;
      titleCell.font = {
        name: 'Arial',
        size: 14,
        bold: true,
        color: { argb: '000000' },
      };
      titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      worksheet.getRow(2).height = 25;

      // Add empty row for spacing
      worksheet.addRow([]);

      // Define column headers in French
      const headers = [
        'Matricule',
        'Nom Complet',
        'Genre',
        'État Civil',
        'Téléphone',
        'WhatsApp',
        'Email',
        'Commissions',
        "Niveau d'Éducation",
        'Profession',
        'Commune',
        'Quartier',
        'Adresse',
        'Église',
      ];

      const headerRow = worksheet.addRow(headers);

      // Set column widths
      worksheet.getColumn(1).width = 10; // Matricule
      worksheet.getColumn(2).width = 30; // Nom Complet
      worksheet.getColumn(3).width = 8; // Genre
      worksheet.getColumn(4).width = 20; // État Civil
      worksheet.getColumn(5).width = 20; // Téléphone
      worksheet.getColumn(6).width = 20; // WhatsApp
      worksheet.getColumn(7).width = 30; // Email
      worksheet.getColumn(8).width = 20; // Commissions
      worksheet.getColumn(9).width = 20; // Niveau d'Éducation
      worksheet.getColumn(10).width = 20; // Profession
      worksheet.getColumn(11).width = 15; // Commune
      worksheet.getColumn(12).width = 20; // Quartier
      worksheet.getColumn(13).width = 30; // Adresse
      worksheet.getColumn(14).width = 20; // Église

      // Style header row
      const styleHeaderCell = (cell: ExcelJS.Cell) => {
        // eslint-disable-next-line no-param-reassign
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2B3544' },
        };
        // eslint-disable-next-line no-param-reassign
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFF' },
          name: 'Arial',
          size: 12,
        };
        // eslint-disable-next-line no-param-reassign
        cell.alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        // eslint-disable-next-line no-param-reassign
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      };

      const styleDataCell = (cell: ExcelJS.Cell, rowColor: string) => {
        // eslint-disable-next-line no-param-reassign
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowColor },
        };
        // eslint-disable-next-line no-param-reassign
        cell.alignment = {
          horizontal: 'left',
          vertical: 'middle',
        };
        // eslint-disable-next-line no-param-reassign
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        // eslint-disable-next-line no-param-reassign
        cell.font = {
          name: 'Arial',
          size: 11,
        };
      };

      headerRow.height = 25;
      headerRow.eachCell(styleHeaderCell);

      // Add data rows
      allUsers.data.forEach((user, index) => {
        const dataRow = worksheet.addRow([
          user.matricule || '',
          `${user.firstName} ${user.lastName}`,
          translateGender(user.gender),
          translateMaritalStatus(user.maritalStatus),
          user.phoneNumber || '',
          user.whatsappNumber || '',
          user.email || '',
          (user.commissions || []).map(translateCommission).join('; '),
          translateEducationLevel(user.educationLevel),
          translateProfession(user.profession),
          translateCommune(user.commune),
          user.quarter || '',
          user.address || '',
          user.churchOfOrigin || '',
        ]);

        const rowColor = index % 2 === 0 ? 'F3F4F6' : 'FFFFFF';

        dataRow.eachCell((cell) => styleDataCell(cell, rowColor));
      });

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `users_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Liste des choristes</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <SearchInput onSearch={handleSearch} />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-900 p-1 text-[12px] font-semibold text-white hover:bg-gray-600 sm:flex-none sm:px-4 md:px-3 md:py-2 md:text-sm"
            >
              <FaFilter className="size-3 md:size-4" />
              <span>Filtres</span>
            </button>
            <button
              onClick={exportUsers}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-700 p-1 text-[12px] font-semibold text-white hover:bg-green-600 sm:flex-none sm:px-4 md:px-3 md:py-2 md:text-sm"
            >
              <HiDownload className="size-3 md:size-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsPopupOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 p-1 text-[12px] font-semibold text-white hover:bg-blue-600 sm:flex-none sm:px-4 md:px-3 md:py-2 md:text-sm"
            >
              <FaPlus className="size-3 md:size-4" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Genre
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'gender')}
                value={filters.gender || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Tous</option>
                {Object.entries(Gender).map(([key, value]) => (
                  <option key={key} value={value}>
                    {translateGender(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Niveau d&apos;Éducation
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'educationLevel')}
                value={filters.educationLevel || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Tous</option>
                {Object.entries(EducationLevel).map(([key, value]) => (
                  <option key={key} value={value}>
                    {translateEducationLevel(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Profession
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'profession')}
                value={filters.profession || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Tous</option>
                {Object.entries(Profession).map(([key, value]) => (
                  <option key={key} value={value}>
                    {translateProfession(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commune
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'commune')}
                value={filters.commune || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Toutes</option>
                {Object.entries(Commune).map(([key, value]) => (
                  <option key={key} value={value}>
                    {translateCommune(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Commission
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'commission')}
                value={filters.commission || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Toutes</option>
                {Object.entries(Commission).map(([key, value]) => (
                  <option key={key} value={value}>
                    {translateCommission(value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                onChange={(e) => handleFilterChange(e, 'category')}
                value={filters.category || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">All</option>
                {Object.entries(UserCategory).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Matricule
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Commune
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users && users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {(currentPage - 1) * filters.limit! + index + 1}
                    </td>
                    <td className="flex flex-row items-center gap-2 px-4 py-3">
                      <img
                        src="https://res.cloudinary.com/dmkqwd4hm/image/upload/v1741798773/Choir/sample_odjx73.jpg"
                        alt="Profile"
                        className="size-6 rounded-full object-cover"
                      />
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3">{user.matricule}</td>
                    <td className="px-4 py-3">{user.phoneNumber}</td>
                    <td className="px-4 py-3">{user.commune}</td>
                    <td className="flex space-x-4 px-4 py-3">
                      <button
                        onClick={() => handleView(user)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleUpdate(user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {users && users.length > 0 ? (
            users.map((user, index) => (
              <div
                key={user.id}
                className="overflow-hidden rounded-lg bg-white shadow"
              >
                <div className="p-4">
                  <div className="flex flex-row items-center justify-between">
                    <p className="text-sm text-gray-500">
                      #{(currentPage - 1) * filters.limit! + index + 1}
                    </p>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {user.matricule}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center gap-4">
                    <img
                      src="https://res.cloudinary.com/dmkqwd4hm/image/upload/v1741798773/Choir/sample_odjx73.jpg"
                      alt="Profile"
                      className="size-12 rounded-full object-cover"
                    />
                    <div className="">
                      <h3 className="text-lg font-medium">
                        {user.firstName} {user.lastName}
                      </h3>

                      <span className="truncate text-sm text-gray-600">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span>{user.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commune:</span>
                      <span>{user.commune}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="my-2 h-[1px] w-full bg-gray-500" />

                  <div className="flex justify-end space-x-6">
                    <button
                      onClick={() => handleView(user)}
                      className=" text-green-500 hover:bg-green-50"
                    >
                      <FaEye className="size-4 md:size-5" />
                    </button>
                    <button
                      onClick={() => handleUpdate(user)}
                      className=" text-blue-500 hover:bg-blue-50"
                    >
                      <FaEdit className="size-4 md:size-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className=" text-red-500 hover:bg-red-50"
                    >
                      <FaTrash className="size-4 md:size-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">No users found.</div>
          )}
        </div>

        <div className="mt-6">
          <Pagination
            totalPages={Math.ceil(totalUsers / filters.limit!)}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isPopupOpen && (
        <UserRegistration
          onClose={() => setIsPopupOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
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
    </Layout>
  );
};

export default UsersManagement;
