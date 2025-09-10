import { jsPDF as JSPDF } from 'jspdf';
import type { CellHookData } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import React, { useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaEdit,
  FaEye,
  FaFilter,
  FaMoneyBill,
  FaPlus,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
} from 'react-icons/fa';
import { HiDownload } from 'react-icons/hi';

import AttendanceDetailsPopup from '@/components/attendance/UserAttendanceDetails';
import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import LeadCredentialsPopup from '@/components/LeadCredentialsPopup';
import Pagination from '@/components/pagination';
import UserContributionsDetails from '@/components/transactions/UserContributionsDetails';
import { useAuth } from '@/providers/AuthProvider';

import {
  canCreateUsers,
  canDeleteUsers,
  canUpdateUsers,
  canViewAttendance,
  canViewContributions,
} from '../../../lib/user/permissions';
import {
  Commission,
  Commune,
  EducationLevel,
  Gender,
  Profession,
  type User,
  UserCategory,
  type UserFilters,
} from '../../../lib/user/type';
import { FetchUsers } from '../../../lib/user/user_actions';
import UserRegistration from './crud/create';
import DeleteUser from './crud/delete';
import UpdateUser from './crud/update';
import ViewUser, { translateCategory } from './crud/view';

const translateGender = (gender: string): string => {
  const translations: Record<string, string> = {
    MALE: 'Masculin',
    FEMALE: 'Féminin',
  };
  return translations[gender] || gender;
};

const translateEducationLevel = (level: string): string => {
  const translations: Record<string, string> = {
    'N/A': 'N/A',
    CERTIFICAT: 'Certificat',
    A3: 'A3',
    A2: 'A2',
    HUMANITE_INCOMPLETE: 'Humanités Incomplètes',
    DIPLOME_ETAT: "Diplôme d'État",
    GRADUE: 'Gradué',
    LICENCIE: 'Licencié',
    MASTER: 'Master',
    DOCTEUR: 'Docteur',
  };
  return translations[level] || level;
};

const translateProfession = (profession: string): string => {
  const translations: Record<string, string> = {
    LIBERAL: 'Libéral',
    FONCTIONNAIRE: 'Fonctionnaire',
    AGENT_ONG: 'Agent ONG',
    SANS_EMPLOI: 'Sans Emploi',
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

const getActiveFilterButton = (isActive: boolean | undefined) => {
  if (isActive === true) {
    return {
      className: 'bg-green-600 hover:bg-green-700',
      icon: <FaToggleOn className="size-3 md:size-4" />,
      text: 'Actifs',
      title: 'Afficher les inactifs',
    };
  }
  if (isActive === false) {
    return {
      className: 'bg-red-600 hover:bg-red-700',
      icon: <FaToggleOff className="size-3 md:size-4" />,
      text: 'Inactifs',
      title: 'Afficher tous',
    };
  }
  return {
    className: 'bg-yellow-600 hover:bg-yellow-700',
    icon: null,
    text: 'Status',
    title: 'Afficher les actifs',
  };
};

const UsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
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
    sortBy: 'lastName',
    order: 'ASC',
  });
  const [isAttendancePopupOpen, setIsAttendancePopupOpen] = useState(false);
  const [isContributionsPopupOpen, setIsContributionsPopupOpen] =
    useState(false);
  const [showLeadCredentials, setShowLeadCredentials] = useState(false);
  const [leadCredentials, setLeadCredentials] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null>(null);

  const loadUsers = async () => {
    const apiFilters = {
      ...filters,
      page: currentPage,
      isActive: filters.isActive === undefined ? undefined : filters.isActive,
    };
    const response = await FetchUsers(apiFilters);

    if (response.data) {
      setUsers(response.data);
      setTotalUsers(response.total);
    }
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

  const handleViewAttendance = (user: User) => {
    setSelectedUser(user);
    setIsAttendancePopupOpen(true);
  };

  const handleViewContributions = (user: User) => {
    setSelectedUser(user);
    setIsContributionsPopupOpen(true);
  };

  const exportUsers = async () => {
    try {
      const AllUsers = await FetchUsers({ ...filters, limit: totalUsers });

      const doc = new JSPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 15;

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
        // Silently ignore logo loading errors - PDF will still be generated without logo
        console.warn('Failed to add logo to PDF:', error);
      }

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
      doc.text('REGISTRE DE CHORISTES', margin, 45);

      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.setFontSize(10);
      doc.text(`Date: ${currentDate}`, margin, 52);

      const headers = [
        'N°',
        'Nom Complet',
        'Genre',
        'Matricule',
        'Téléphone',
        'WhatsApp',
        'Commissions',
        'Catégories',
        'Profession',
        "Niveau d'études",
        'Statut',
        'Adresse',
      ];

      const tableData = AllUsers.data.map((user, index) => {
        const addressParts = [];
        if (user.commune) addressParts.push(translateCommune(user.commune));
        if (user.quarter) addressParts.push(user.quarter);
        if (user.address) addressParts.push(user.address);
        const fullAddress =
          addressParts.length > 0 ? addressParts.join(', ') : '-';

        return [
          index + 1,
          `${user.lastName} ${user.firstName}`,
          translateGender(user.gender || Gender.MALE),
          user.matricule || '-',
          user.phoneNumber || '-',
          user.whatsappNumber || '-',
          (user.commissions || []).map(translateCommission).join('; ') || '-',
          (user.categories || []).map(translateCategory).join('; ') || '-',
          translateProfession(user.profession || Profession.UNEMPLOYED),
          translateEducationLevel(user.educationLevel || EducationLevel.NONE),
          user.isActive ? 'Actif' : 'Inactif',
          fullAddress,
        ];
      });

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
        theme: 'grid',
        styles: {
          fontSize: 7,
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
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' }, // N°
          1: { cellWidth: 30 }, // Nom Complet
          2: { cellWidth: 15, halign: 'center' }, // Genre
          3: { cellWidth: 20, halign: 'center' }, // Matricule
          4: { cellWidth: 25 }, // Téléphone
          5: { cellWidth: 25 }, // WhatsApp
          6: { cellWidth: 25 }, // Email
          7: { cellWidth: 25 }, // Commissions
          8: { cellWidth: 20 }, // Catégories
          9: { cellWidth: 20 }, // Profession
          10: { cellWidth: 20 }, // Niveau d'études
          12: { cellWidth: 15, halign: 'center' }, // Statut
          11: { cellWidth: 40 }, // Adresse
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

      doc.save(`registre_choristes_${currentDate.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleActiveFilterToggle = () => {
    setFilters((prev) => {
      let newIsActive;
      if (prev.isActive === undefined) {
        newIsActive = true;
      } else if (prev.isActive === true) {
        newIsActive = false;
      } else {
        newIsActive = undefined;
      }

      return {
        ...prev,
        isActive: newIsActive,
        page: 1,
      };
    });
    setCurrentPage(1);
  };

  const getStatusIndicator = (user: User) => {
    return (
      <div
        className={`rounded-full px-3 py-1 text-center text-sm font-medium ${
          user.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {user.isActive ? (
          <>
            <span>Actif</span>
          </>
        ) : (
          <>
            <span>Inactif</span>
          </>
        )}
      </div>
    );
  };

  const renderActionButtons = (viewedUser: User, isMobile = false) => {
    const buttonClasses = isMobile
      ? {
          base: 'hover:bg-opacity-10',
          view: 'text-green-500 hover:bg-green-50',
          edit: 'text-blue-500 hover:bg-blue-50',
          attendance: 'text-purple-500 hover:bg-purple-50',
          contributions: 'text-yellow-500 hover:bg-yellow-50',
          lead: 'text-indigo-500 hover:bg-indigo-50',
          delete: 'text-red-500 hover:bg-red-50',
        }
      : {
          base: '',
          view: 'text-green-500 hover:text-green-700',
          edit: 'text-blue-500 hover:text-blue-700',
          attendance: 'text-purple-500 hover:text-purple-700',
          contributions: 'text-yellow-500 hover:text-yellow-700',
          lead: 'text-indigo-500 hover:text-indigo-700',
          delete: 'text-red-500 hover:text-red-700',
        };

    const iconClasses = isMobile ? 'size-4 md:size-5' : '';

    return (
      <div
        className={`flex items-center ${isMobile ? 'justify-end space-x-6' : 'space-x-4 px-4 py-3'}`}
      >
        <button
          onClick={() => handleView(viewedUser)}
          className={buttonClasses.view}
          title="View Details"
        >
          <FaEye className={iconClasses} />
        </button>
        {canUpdateUsers(currentUser?.role) && (
          <button
            onClick={() => handleUpdate(viewedUser)}
            className={buttonClasses.edit}
            title="Edit"
          >
            <FaEdit className={iconClasses} />
          </button>
        )}
        {canViewAttendance(currentUser?.role) && (
          <button
            onClick={() => handleViewAttendance(viewedUser)}
            className={buttonClasses.attendance}
            title="View Attendance"
          >
            <FaCalendarAlt className={iconClasses} />
          </button>
        )}
        {canViewContributions(currentUser?.role) && (
          <button
            onClick={() => handleViewContributions(viewedUser)}
            className={buttonClasses.contributions}
            title="View Contributions"
          >
            <FaMoneyBill className={iconClasses} />
          </button>
        )}
        {canDeleteUsers(currentUser?.role) && (
          <>
            <button
              onClick={() => handleDelete(viewedUser)}
              className={buttonClasses.delete}
              title="Delete"
            >
              <FaTrash className={iconClasses} />
            </button>
          </>
        )}
      </div>
    );
  };

  const activeFilterButton = getActiveFilterButton(filters.isActive);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Liste de membres</h1>
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
              onClick={handleActiveFilterToggle}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md p-1 text-[12px] font-semibold text-white sm:flex-none sm:px-4 md:px-3 md:py-2 md:text-sm ${activeFilterButton.className}`}
              title={activeFilterButton.title}
            >
              {activeFilterButton.icon}
              <span>{activeFilterButton.text}</span>
            </button>
            {canCreateUsers(currentUser?.role) && (
              <>
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
              </>
            )}
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
                  Noms
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
                  Téléphone
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Adresse
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Statut
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
                    <td className="flex flex-col gap-1 px-4 py-3 font-semibold">
                      {/* <img
                        src="https://res.cloudinary.com/dmkqwd4hm/image/upload/v1741798773/Choir/sample_odjx73.jpg"
                        alt="Profile"
                        className="size-6 rounded-full object-cover"
                      /> */}
                      {user.lastName} {user.firstName} <br />
                      <span className="text-xs text-gray-700">
                        {' '}
                        {user.categories && user.categories.length > 0 ? (
                          user.categories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800"
                            >
                              {translateCategory(category)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Normal</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.gender}</td>
                    <td className="px-4 py-3">{user.matricule}</td>
                    <td className="px-4 py-3">{user.commissions}</td>
                    <td className="px-4 py-3">{user.phoneNumber}</td>
                    <td className="px-4 py-3">{user.address}</td>
                    <td className="px-4 py-3">{getStatusIndicator(user)}</td>
                    <td className="px-4 py-3">
                      {renderActionButtons(user, false)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-4 text-center">
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
                        {user.lastName} {user.firstName}
                      </h3>
                      <span className="text-xs text-gray-700">
                        {' '}
                        {user.categories && user.categories.length > 0 ? (
                          user.categories.map((category) => (
                            <span
                              key={category}
                              className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                            >
                              {translateCategory(category)}
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
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Statut:</span>
                      <div className="flex items-center">
                        {getStatusIndicator(user)}
                      </div>
                    </div>
                  </div>

                  <div className="my-2 h-[1px] w-full bg-gray-500" />

                  {renderActionButtons(user, true)}
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
            onPageChange={handlePageChange}
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
      {isAttendancePopupOpen && selectedUser && (
        <AttendanceDetailsPopup
          user={selectedUser}
          onClose={() => setIsAttendancePopupOpen(false)}
        />
      )}
      {isContributionsPopupOpen && selectedUser && (
        <UserContributionsDetails
          user={selectedUser}
          onClose={() => setIsContributionsPopupOpen(false)}
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

export default UsersManagement;
