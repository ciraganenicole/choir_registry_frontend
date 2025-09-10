import { useRouter } from 'next/router';
import React, { useState } from 'react';
import {
  FaArrowLeft,
  FaClock,
  FaEdit,
  FaEye,
  FaMusic,
  FaPlus,
  FaRegCalendarAlt,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';
import SongDetail from '@/components/library/SongDetail';
import SongForm from '@/lib/library/form';
import type { Song } from '@/lib/library/logic';
import {
  canCreateSongs,
  difficultyOptions,
  filterSongs,
  genreSuggestions,
  searchSongs,
  SongDifficulty,
  SongStatus,
  statusOptions,
  useSongById,
  useSongs,
  useSongStats,
} from '@/lib/library/logic';
import { useAuth } from '@/providers/AuthProvider';

const SongDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { song, isLoading, error } = useSongById(id as string);

  // Library page state
  const [showForm, setShowForm] = useState(false);
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

  const {
    songs,
    isLoading: songsLoading,
    error: songsError,
    refetch,
  } = useSongs();
  const { stats } = useSongStats();

  // Check if user has access to library
  const canCreate = user ? canCreateSongs(user.role, user.categories) : false;

  const handleBack = () => {
    router.push('/library');
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedSongForEdit(null);
    // Refresh the song data
    refetch();
  };

  // Library page helper functions
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

  // Filter and search songs
  const filteredSongs = songs
    ? filterSongs(searchSongs(songs, searchTerm), {
        genre: filters.genre || undefined,
        difficulty: filters.difficulty || undefined,
        status: filters.status || undefined,
      })
    : [];

  // Stats data
  const statsData = [
    {
      label: 'Total des Chants',
      value: stats?.totalSongs || 0,
      sub: 'Dans la bibliothèque',
      icon: <FaMusic className="ml-2 text-xl text-orange-400" />,
    },
    {
      label: 'Chants Actifs',
      value: stats?.activeRepertoire || 0,
      sub: 'Prêt à interpréter',
      icon: <FaUsers className="ml-2 text-xl text-orange-400" />,
    },
    {
      label: 'En Répétition',
      value: stats?.inRehearsal || 0,
      sub: "En cours d'apprentissage",
      icon: <FaClock className="ml-2 text-xl text-orange-400" />,
    },
    {
      label: 'Nouvelles Ajouts',
      value: stats?.newAdditions || 0,
      sub: 'Ce mois',
      icon: <FaRegCalendarAlt className="ml-2 text-xl text-orange-400" />,
    },
  ];

  if (isLoading || songsLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-semibold text-gray-900">
              Chargement...
            </div>
            <div className="text-gray-500">
              Veuillez patienter pendant que nous récupérons les informations.
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !song) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-2xl font-semibold text-gray-900">
              Chant Non Trouvé
            </div>
            <div className="mb-4 text-gray-500">
              {error || "Le chant que vous recherchez n'a pas pu être trouvé."}
            </div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              <FaArrowLeft /> Retour à la Bibliothèque
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Library Page Content */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Répertoire</h1>
          <p className="text-base text-gray-500">
            Gérez la bibliothèque musicale et les arrangements de votre chorale
          </p>
        </div>
        {canCreate && (
          <button
            className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 md:self-auto"
            onClick={() => setShowForm(true)}
          >
            <FaPlus /> Ajouter un Chant
          </button>
        )}
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

      {/* Edit Song Modal */}
      {showEditForm && (selectedSongForEdit || song) && (
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
                    {(selectedSongForEdit || song)?.title}&quot;
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
                song={selectedSongForEdit || song}
                onSuccess={handleEditSuccess}
                onClose={() => {
                  setShowEditForm(false);
                  setSelectedSongForEdit(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="border-l-4 border-orange-400">
            <CardContent>
              <div className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{stat.sub}</div>
                </div>
                <div>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 rounded-lg border border-gray-300 bg-white p-1 md:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher des chants, compositeurs ou genres..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <div className="mt-2 flex flex-row gap-2 md:mt-0">
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              <option value="">Tous les Genres</option>
              {genreSuggestions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              <option value="">Toutes les Difficultés</option>
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              <option value="">Tous les Statuts</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center">
          <FaMusic className="mr-2 text-xl text-gray-700" />
          <h2 className="mr-2 text-xl font-bold text-gray-900">
            Bibliothèque de Chants
          </h2>
        </div>
        <p className="mb-4 text-gray-500">
          Collection complète du répertoire de votre chorale
        </p>

        {(() => {
          if (songsLoading) {
            return (
              <div className="py-8 text-center">
                <div className="text-gray-500">Chargement des chants...</div>
              </div>
            );
          }
          if (songsError) {
            return (
              <div className="py-8 text-center">
                <div className="text-red-500">Erreur : {songsError}</div>
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
            <div className="flex flex-col gap-4">
              {filteredSongs.map((songItem: Song) => (
                <div
                  key={songItem.id}
                  className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-row items-center">
                      <span className="mr-2 text-xl font-bold text-gray-900">
                        {songItem.title}
                      </span>
                      {statusBadge(songItem.status)}
                      {difficultyBadge(songItem.difficulty)}
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div>
                        <div className="font-medium text-gray-700">
                          Compositeur
                        </div>
                        <div>{songItem.composer}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Genre</div>
                        <div>{songItem.genre}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-[120px] flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Interprété</div>
                      <div className="text-lg font-bold text-orange-500">
                        {songItem.performed}x
                      </div>
                      {songItem.lastPerformance && (
                        <div className="mt-1 text-xs text-gray-500">
                          Dernière Performance
                          <br />
                          <span className="font-medium text-gray-700">
                            {songItem.lastPerformance}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-row gap-2">
                      <button
                        onClick={() => router.push(`/library/${songItem.id}`)}
                        className="flex items-center gap-1 rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FaEye /> Voir les Détails
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSongForEdit(songItem);
                          setShowEditForm(true);
                        }}
                        className="flex items-center gap-1 rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FaEdit /> Modifier
                      </button>
                      <button className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                        Partition
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Song Detail Popup */}
      <SongDetail song={song} onClose={handleBack} onEdit={handleEdit} />
    </Layout>
  );
};

export default SongDetailPage;
