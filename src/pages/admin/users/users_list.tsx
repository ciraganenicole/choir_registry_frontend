import { jsPDF as JSPDF } from 'jspdf';
import type { CellHookData } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
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
      const AllUsers = await FetchUsers({ ...filters, limit: totalUsers });

      // Create PDF document with consistent margins
      const doc = new JSPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 15;

      // Add logo
      try {
        const response = await fetch('/assets/images/Wlogo.png');
        const blob = await response.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        doc.addImage(base64, 'PNG', margin, margin, 35, 20);
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }

      // Add header text with exact positioning
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
        margin + 40,
        20,
      );
      doc.text('5è CELPA SALEM GOMA', margin + 40, 25);
      doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 40, 30);

      doc.setFontSize(12);
      doc.text('REGISTRE DES CHORISTES', margin, 45);

      // Add current date
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.setFontSize(10);
      doc.text(`Date: ${currentDate}`, margin, 52);

      // Define table headers
      const headers = [
        'N°',
        'Nom Complet',
        'Genre',
        'Téléphone',
        'WhatsApp',
        'Commissions',
        'Profession',
        'Adresse',
      ];

      // Prepare table data
      const tableData = AllUsers.data.map((user, index) => {
        // Format address parts
        const addressParts = [];
        if (user.commune) addressParts.push(translateCommune(user.commune));
        if (user.quarter) addressParts.push(user.quarter);
        if (user.address) addressParts.push(user.address);
        const fullAddress =
          addressParts.length > 0 ? addressParts.join(', ') : '-';

        return [
          index + 1,
          `${user.firstName} ${user.lastName}`,
          translateGender(user.gender),
          user.phoneNumber || '-',
          user.whatsappNumber || '-',
          (user.commissions || []).map(translateCommission).join('; ') || '-',
          translateProfession(user.profession),
          fullAddress,
        ];
      });

      // Add table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [43, 53, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' }, // N°
          1: { cellWidth: 35 }, // Nom Complet
          2: { cellWidth: 15, halign: 'center' }, // Genre
          3: { cellWidth: 22 }, // Téléphone
          4: { cellWidth: 22 }, // WhatsApp
          5: { cellWidth: 30 }, // Commissions
          6: { cellWidth: 20 }, // Profession
          7: { cellWidth: 30 }, // Adresse (combined)
        },
        didParseCell: (hookData: CellHookData) => {
          const styles = { ...hookData.cell.styles };

          styles.lineWidth = 0.1;
          styles.lineColor = [0, 0, 0];

          if (hookData.section === 'body' && hookData.row.index % 2 === 0) {
            styles.fillColor = [240, 240, 240];
          }

          Object.assign(hookData.cell.styles, styles);
        },
      });

      // Save PDF
      doc.save(`registre_choristes_${currentDate.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.log(error);
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
                  Genre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Matricule
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Address
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
                    <td className="flex flex-row items-center gap-2 px-4 py-3 font-semibold">
                      {/* <img
                        src="https://res.cloudinary.com/dmkqwd4hm/image/upload/v1741798773/Choir/sample_odjx73.jpg"
                        alt="Profile"
                        className="size-6 rounded-full object-cover"
                      /> */}
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3">{user.gender}</td>
                    <td className="px-4 py-3">{user.matricule}</td>
                    <td className="px-4 py-3">{user.commissions}</td>
                    <td className="px-4 py-3">{user.phoneNumber}</td>
                    <td className="px-4 py-3">{user.address}</td>
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
                    {/* <img
                      src="https://res.cloudinary.com/dmkqwd4hm/image/upload/v1741798773/Choir/sample_odjx73.jpg"
                      alt="Profile"
                      className="size-12 rounded-full object-cover"
                    /> */}
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
          _onUserCreated={handleUserCreated}
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
