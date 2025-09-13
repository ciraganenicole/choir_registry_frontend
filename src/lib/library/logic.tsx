import { useEffect, useState } from 'react';

import { api } from '@/config/api';
import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

export interface Song {
  id: string;
  title: string;
  composer: string;
  genre: string;
  difficulty: SongDifficulty;
  status: SongStatus;
  lyrics?: string;
  pdfFile?: string; // URL or path to the PDF file
  performed: number;
  lastPerformance?: string;
  added_by?: any;
  addedById?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum SongDifficulty {
  EASY = 'Easy',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum SongStatus {
  ACTIVE = 'Active',
  IN_REHEARSAL = 'In Rehearsal',
  ARCHIVED = 'Archived',
}

export interface CreateSongDto {
  title: string;
  composer: string;
  genre: string;
  difficulty: SongDifficulty;
  status: SongStatus;
  lyrics?: string;
  pdfFile?: string;
}

export interface UpdateSongDto {
  title?: string;
  composer?: string;
  genre?: string;
  difficulty?: SongDifficulty;
  status?: SongStatus;
  lyrics?: string;
  pdfFile?: string;
}

export interface SongFilter {
  genre?: string;
  difficulty?: SongDifficulty;
  status?: SongStatus;
  search?: string;
}

export interface SongStats {
  totalSongs: number;
  activeRepertoire: number;
  inRehearsal: number;
  newAdditions: number;
}

// Permission functions
export const canAccessLibrary = (
  userRole: UserRole,
  _userCategories?: string[],
): boolean => {
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ATTENDANCE_ADMIN ||
    userRole === UserRole.LEAD
  ) {
    return true;
  }

  return false;
};

export const canCreateSongs = (
  userRole: UserRole,
  userCategories?: string[],
): boolean => {
  // Check if user has lead category (same as rehearsal permissions)
  if (userCategories?.includes('lead')) {
    return true;
  }

  // Also allow super admin and attendance admin roles
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ATTENDANCE_ADMIN
  ) {
    return true;
  }

  return false;
};

// Hook to fetch all songs with optional filtering
export const useSongs = (filters?: SongFilter) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check authentication
      if (!isAuthenticated || !user) {
        setError('Authentication required');
        return;
      }

      // Check permissions - LEAD is a category, not a role
      const hasAccess = canAccessLibrary(user.role, user.categories);
      if (!hasAccess) {
        setError('Insufficient permissions to access library');
        return;
      }

      const params = new URLSearchParams();
      if (filters?.genre) params.append('genre', filters.genre);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      // Add pagination parameters to get all songs for now
      params.append('page', '1');
      params.append('limit', '1000'); // Get a large number to avoid pagination issues

      const response = await api.get(`/songs?${params.toString()}`);

      // Handle different response formats
      let songsData: Song[] = [];
      if (response.data && Array.isArray(response.data)) {
        songsData = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        songsData = response.data.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        songsData = response.data.items;
      } else {
        songsData = [];
      }

      setSongs(songsData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access library');
      } else {
        setError(err.message || 'Failed to fetch songs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSongs();
    } else {
      setIsLoading(false);
    }
  }, [filters, isAuthenticated, user]);

  return { songs, isLoading, error, refetch: fetchSongs };
};

// Hook to create a new song
export const useCreateSong = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const createSong = async (songData: CreateSongDto): Promise<Song | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check authentication
      if (!isAuthenticated || !user) {
        setError('Authentication required');
        return null;
      }

      // Check permissions - LEAD is a category, not a role
      const hasAccess = canCreateSongs(user.role, user.categories);
      if (!hasAccess) {
        setError('Insufficient permissions to create songs');
        return null;
      }

      const response = await api.post('/songs', songData);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to create songs');
      } else {
        const errorMessage =
          err.response?.data?.message || err.message || 'Failed to create song';
        setError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createSong, isLoading, error };
};

// Hook to update a song
export const useUpdateSong = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSong = async (
    id: string,
    songData: UpdateSongDto,
  ): Promise<Song | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.patch(`/songs/${id}`, songData);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update song';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateSong, isLoading, error };
};

// Hook to delete a song
export const useDeleteSong = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSong = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      await api.delete(`/songs/${id}`);
      return true;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete song';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteSong, isLoading, error };
};

// Hook to fetch song statistics
export const useSongStats = () => {
  const [stats, setStats] = useState<SongStats>({
    totalSongs: 0,
    activeRepertoire: 0,
    inRehearsal: 0,
    newAdditions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check authentication
      if (!isAuthenticated || !user) {
        setError('Authentication required');
        return;
      }

      // Check permissions - LEAD is a category, not a role
      const hasAccess = canAccessLibrary(user.role, user.categories);
      if (!hasAccess) {
        setError('Insufficient permissions to access library');
        return;
      }

      // Fetch all songs to calculate stats
      const response = await api.get('/songs');

      // Handle different response formats
      let songs: Song[] = [];
      if (response.data && Array.isArray(response.data)) {
        songs = response.data;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        songs = response.data.data;
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        songs = response.data.items;
      } else {
        songs = [];
      }

      const now = new Date();
      const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );

      const calculatedStats: SongStats = {
        totalSongs: songs.length,
        activeRepertoire: songs.filter(
          (song) => song.status === SongStatus.ACTIVE,
        ).length,
        inRehearsal: songs.filter(
          (song) => song.status === SongStatus.IN_REHEARSAL,
        ).length,
        newAdditions: songs.filter((song) => {
          if (!song.createdAt) return false;
          const createdAt = new Date(song.createdAt);
          return createdAt >= oneMonthAgo;
        }).length,
      };

      setStats(calculatedStats);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access library');
      } else {
        setError(err.message || 'Failed to fetch song statistics');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  return { stats, isLoading, error, refetch: fetchStats };
};

// Hook to fetch a single song by ID
export const useSongById = (id: string) => {
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchSong = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated || !user) {
        setError('Authentication required');
        return;
      }

      const hasAccess = canAccessLibrary(user.role, user.categories);
      if (!hasAccess) {
        setError('Insufficient permissions to access library');
        return;
      }

      const response = await api.get(`/songs/${id}`);
      setSong(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Insufficient permissions to access library');
      } else {
        setError(err.message || 'Failed to fetch song');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id && isAuthenticated && user) {
      fetchSong();
    } else {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, user]);

  return { song, isLoading, error, refetch: fetchSong };
};

export const getSongById = async (id: string): Promise<Song | null> => {
  try {
    const response = await api.get(`/songs/${id}`);
    return response.data;
  } catch (err: any) {
    return null;
  }
};

export const searchSongs = (songs: Song[], searchTerm: string): Song[] => {
  if (!searchTerm.trim()) return songs;

  const term = searchTerm.toLowerCase();
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(term) ||
      song.composer.toLowerCase().includes(term) ||
      song.genre.toLowerCase().includes(term) ||
      song.lyrics?.toLowerCase().includes(term),
  );
};

export const filterSongs = (songs: Song[], filters: SongFilter): Song[] => {
  return songs.filter((song) => {
    if (filters.genre && song.genre !== filters.genre) return false;
    if (filters.difficulty && song.difficulty !== filters.difficulty)
      return false;
    if (filters.status && song.status !== filters.status) return false;
    return true;
  });
};

export const canUpdateSongs = (
  userRole: UserRole,
  userCategories?: string[],
): boolean => {
  // Check if user has lead category (same as rehearsal permissions)
  if (userCategories?.includes('lead')) {
    return true;
  }

  // Also allow super admin and attendance admin roles
  if (
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ATTENDANCE_ADMIN
  ) {
    return true;
  }

  return false;
};

export const canDeleteSongs = (userRole: UserRole): boolean => {
  return userRole === UserRole.SUPER_ADMIN;
};

export const voicePartOptions = [
  'Soprano',
  'Alto',
  'Tenor',
  'Bass',
  'Mezzo Soprano',
  'Baritone',
];

export const difficultyOptions = [
  { value: SongDifficulty.EASY, label: 'Facile' },
  { value: SongDifficulty.INTERMEDIATE, label: 'Moyen' },
  { value: SongDifficulty.ADVANCED, label: 'Difficile' },
];

export const statusOptions = [
  { value: SongStatus.ACTIVE, label: 'Actif' },
  { value: SongStatus.IN_REHEARSAL, label: 'En répétition' },
  { value: SongStatus.ARCHIVED, label: 'Archivé' },
];

export const genreSuggestions = [
  'Classique',
  'Contemporain',
  'Gospel',
  'Spirituel',
  'Folk',
  'Jazz',
  'Pop',
  'Rock',
  'Fêtes',
  'Traditionnel',
  'Baroque',
  'Renaissance',
  'Romantique',
  'Moderne',
];
