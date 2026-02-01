import React, { useCallback, useMemo, useState } from 'react';
import {
  FaClock,
  FaEdit,
  FaEye,
  FaFilePdf,
  FaMusic,
  FaPlus,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import ConfirmationDialog from '@/components/dialog/ConfirmationDialog';
import Layout from '@/components/layout';
import SongDetail from '@/components/library/SongDetail';
import { SongPerformanceCount } from '@/components/library/SongPerformanceCount';
import Pagination from '@/components/pagination';
import SongForm from '@/lib/library/form';
import type { Song } from '@/lib/library/logic';
import {
  canDeleteSongs,
  canManageSongs,
  canUpdateSpecificSong,
  difficultyOptions,
  filterSongs,
  searchSongs,
  SongDifficulty,
  SongStatus,
  statusOptions,
  useDeleteSong,
  useSongs,
  useSongStats,
} from '@/lib/library/logic';
import { exportSongListToPDF } from '@/lib/library/pdf-export';
import { useAuth } from '@/providers/AuthProvider';

const LibraryPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showSongDetail, setShowSongDetail] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedSongForEdit, setSelectedSongForEdit] = useState<Song | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    difficulty: '' as SongDifficulty | '',
    status: '' as SongStatus | '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 5;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);

  const { user } = useAuth();
  const { songs, isLoading, error, refetch } = useSongs();
  const { stats } = useSongStats();
  const { deleteSong, isLoading: isDeleting } = useDeleteSong();

  // Check if user can manage songs (SUPER_ADMIN or LEAD category users)
  const canManageSongsPermission = user
    ? canManageSongs(user.role, user.categories)
    : false;
  const canDeleteSongsPermission = user ? canDeleteSongs(user.role) : false;

  // Filter and search songs
  const filteredSongs = React.useMemo(() => {
    // Ensure songs is always an array
    if (!Array.isArray(songs)) {
      return [];
    }

    let result = songs;

    // Apply search
    if (searchTerm) {
      result = searchSongs(result, searchTerm);
    }

    // Apply filters
    if (filters.genre || filters.difficulty || filters.status) {
      result = filterSongs(result, {
        genre: filters.genre || undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
      });
    }

    return result;
  }, [songs, searchTerm, filters]);

  // Memoize pagination logic
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredSongs.length / songsPerPage);
    const startIndex = (currentPage - 1) * songsPerPage;
    const endIndex = startIndex + songsPerPage;
    const currentSongs = filteredSongs.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentSongs };
  }, [filteredSongs, currentPage, songsPerPage]);

  const { totalPages, currentSongs } = paginationData;

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of song list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoize stats data
  const statsData = useMemo(
    () => [
      {
        label: 'Total des Chants',
        value: stats.totalSongs,
        icon: <FaMusic className="ml-2 text-xl text-orange-400" />,
      },
      {
        label: 'Répertoire Actif',
        value: stats.activeRepertoire,
        icon: <FaUsers className="ml-2 text-xl text-orange-400" />,
      },
      {
        label: 'En Répétition',
        value: stats.inRehearsal,
        icon: <FaClock className="ml-2 text-xl text-orange-400" />,
      },
      {
        label: 'Nouveaux Ajouts',
        value: stats.newAdditions,
        icon: <FaMusic className="ml-2 text-xl text-orange-400" />,
      },
    ],
    [stats],
  );

  const statusBadge = (status: SongStatus) => {
    if (status === SongStatus.ACTIVE)
      return (
        <span className="mr-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Actif
        </span>
      );
    if (status === SongStatus.IN_REHEARSAL)
      return (
        <span className="mr-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          En Répétition
        </span>
      );
    if (status === SongStatus.ARCHIVED)
      return (
        <span className="mr-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          Archivé
        </span>
      );
    return null;
  };

  const difficultyBadge = (difficulty: SongDifficulty) => {
    if (difficulty === SongDifficulty.ADVANCED)
      return (
        <span className="mr-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
          Avancé
        </span>
      );
    if (difficulty === SongDifficulty.INTERMEDIATE)
      return (
        <span className="mr-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          Intermédiaire
        </span>
      );
    return null;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (
    filterType: 'genre' | 'difficulty' | 'status',
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value || '',
    }));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    refetch();
  };

  const handleViewSongDetail = (song: Song) => {
    setSelectedSong(song);
    setShowSongDetail(true);
  };

  const handleCloseSongDetail = () => {
    setShowSongDetail(false);
    setSelectedSong(null);
  };

  const handleDeleteSong = async (song: Song) => {
    setSongToDelete(song);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSong = async () => {
    if (!songToDelete) return;

    const success = await deleteSong(songToDelete.id);
    if (success) {
      refetch(); // Refresh the song list
      setShowDeleteDialog(false);
      setSongToDelete(null);
    }
  };

  const cancelDeleteSong = () => {
    setShowDeleteDialog(false);
    setSongToDelete(null);
  };

  const handleExportList = async () => {
    try {
      await exportSongListToPDF(filteredSongs);
    } catch (exportError) {
      // eslint-disable-next-line no-console
      console.error('Error exporting song list to PDF:', exportError);
      // eslint-disable-next-line no-alert
      alert("Erreur lors de l'exportation de la liste");
    }
  };

  return (
    <Layout>
      {/* {!hasLibraryAccess ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Accès Refusé</h2>
            <p className="text-gray-500">
              Vous n'avez pas la permission d'accéder au module de bibliothèque.
            </p>
          </div>
        </div>
      ) : ( */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 md:text-3xl">
              Répertoire
            </h1>
            <p className="text-[10px] text-gray-500 md:text-base">
              Gérez la bibliothèque musicale et les arrangements de votre
              chorale
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportList}
              disabled={filteredSongs.length === 0}
              className="flex items-center gap-2 self-start rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-400 md:self-auto md:px-6 md:text-base"
            >
              <FaFilePdf /> <span>Exporter Liste</span>
            </button>
            {canManageSongsPermission && (
              <button
                className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 md:self-auto md:px-6 md:text-base"
                onClick={() => setShowForm(true)}
              >
                <FaPlus /> <span>Ajouter un Chant</span>
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                      Ajouter un Chant
                    </h2>
                    <p className="text-sm text-gray-600 sm:text-base">
                      Créez un nouveau chant pour votre répertoire
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="ml-4 shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Fermer"
                  >
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6">
                <SongForm
                  onSuccess={handleFormSuccess}
                  onClose={() => setShowForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-2 grid grid-cols-2 gap-2 md:mb-4 md:grid-cols-4 md:gap-4">
          {statsData.map((stat) => (
            <Card key={stat.label} className="border-l-4 border-orange-400">
              <CardContent>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center text-xs font-medium text-gray-500 sm:text-sm">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                      {stat.value}
                    </div>
                  </div>
                  <div>{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-2 rounded-lg border border-gray-300 bg-white p-3 md:mb-4 md:p-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher des chants, compositeurs ou genres..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-[200px] rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 md:w-full md:text-base"
              />
            </div>
            <div className="flex flex-row gap-2">
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  handleFilterChange('difficulty', e.target.value)
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <option value="">Difficultés</option>
                {difficultyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <option value="">Statuts</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm md:p-6">
          {(() => {
            if (isLoading) {
              return (
                <div className="py-8 text-center">
                  <div className="text-gray-500">Chargement des chants...</div>
                </div>
              );
            }
            if (error) {
              return (
                <div className="py-8 text-center">
                  <div className="text-red-500">Erreur : {error}</div>
                </div>
              );
            }
            if (filteredSongs.length === 0) {
              return (
                <div className="py-8 text-center">
                  <div className="text-gray-500">Aucun chant trouvé</div>
                </div>
              );
            }
            return (
              <div className="flex flex-col gap-2 p-2 md:gap-4 md:p-4">
                {currentSongs.map((song: Song) => (
                  <div
                    key={song.id}
                    className="flex flex-col gap-2 rounded-lg border border-gray-300 p-3 md:flex-row md:items-center md:justify-between md:gap-4 md:p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-row items-center gap-2">
                        <span className="text-lg font-bold text-gray-900 md:text-xl">
                          {song.title}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {statusBadge(song.status)}
                          {difficultyBadge(song.difficulty)}
                        </div>
                      </div>
                      <div className="mb-2 flex flex-row items-center justify-between gap-2 text-sm text-gray-600 md:justify-start md:gap-6">
                        <div>
                          <div className="font-medium text-gray-700">
                            Compositeur
                          </div>
                          <div className="text-sm">{song.composer}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Genre</div>
                          <div className="text-sm">{song.genre}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 md:min-w-[120px] md:flex-col md:items-end md:gap-2">
                      <div className="w-full text-left md:w-auto md:text-right">
                        <div className="flex flex-row items-center justify-between gap-2 md:flex-col md:gap-8">
                          <SongPerformanceCount song={song} />
                          {song.lastPerformance && (
                            <div className="text-xs text-gray-500">
                              Dernière Performance
                              <br />
                              <span className="font-medium text-gray-700">
                                {new Date(
                                  song.lastPerformance,
                                ).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>
                        {song.added_by && (
                          <div className="mt-2 text-xs text-gray-500">
                            Ajouté par :
                            <br />
                            <span className="font-medium text-gray-700">
                              {(() => {
                                if (
                                  typeof song.added_by === 'object' &&
                                  song.added_by.firstName &&
                                  song.added_by.lastName
                                ) {
                                  return `${song.added_by.firstName} ${song.added_by.lastName}`;
                                }
                                if (typeof song.added_by === 'string') {
                                  return song.added_by;
                                }
                                return 'Utilisateur Inconnu';
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex w-full flex-row gap-2 md:w-auto">
                        <button
                          onClick={() => handleViewSongDetail(song)}
                          className="flex w-full items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:w-auto"
                        >
                          <FaEye />{' '}
                          <span className="hidden sm:inline">
                            Voir les Détails
                          </span>
                          <span className="sm:hidden">Détails</span>
                        </button>
                        {canUpdateSpecificSong(
                          user?.role,
                          user?.categories,
                        ) && (
                          <button
                            onClick={() => {
                              setSelectedSongForEdit(song);
                              setShowEditForm(true);
                            }}
                            className="flex w-full items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:w-auto"
                          >
                            <FaEdit />{' '}
                            <span className="hidden sm:inline">Modifier</span>
                            <span className="sm:hidden">Modifier</span>
                          </button>
                        )}
                        {canDeleteSongsPermission && (
                          <button
                            onClick={() => handleDeleteSong(song)}
                            disabled={isDeleting}
                            className="flex w-full items-center justify-center gap-1 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 sm:w-auto"
                          >
                            <FaTrash />{' '}
                            <span className="hidden sm:inline">Supprimer</span>
                            <span className="sm:hidden">Supprimer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Song Detail Popup */}
        {showSongDetail && selectedSong && (
          <SongDetail song={selectedSong} onClose={handleCloseSongDetail} />
        )}

        {/* Edit Song Modal */}
        {showEditForm && selectedSongForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                      Modifier le Chant
                    </h2>
                    <p className="truncate text-sm text-gray-600 sm:text-base">
                      Modifiez les informations du chant &quot;
                      {selectedSongForEdit.title}&quot;
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedSongForEdit(null);
                    }}
                    className="ml-4 shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Fermer"
                  >
                    <svg
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6">
                <SongForm
                  song={selectedSongForEdit}
                  onSuccess={() => {
                    setShowEditForm(false);
                    setSelectedSongForEdit(null);
                    refetch();
                  }}
                  onClose={() => {
                    setShowEditForm(false);
                    setSelectedSongForEdit(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={cancelDeleteSong}
          onConfirm={confirmDeleteSong}
          title="Supprimer le chant"
          message={`Êtes-vous sûr de vouloir supprimer le chant "${songToDelete?.title}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
      {/* )} */}
    </Layout>
  );
};

export default LibraryPage;
