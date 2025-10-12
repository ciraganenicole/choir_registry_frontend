import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FaClock,
  FaEdit,
  FaMicrophone,
  FaMusic,
  FaPlus,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import { useSongs } from '@/lib/library/logic';
import { usePromoteRehearsal } from '@/lib/performance/logic';
import {
  getDifficultyColor,
  getInstrumentOptions,
  getMusicalKeyColor,
  getMusicalKeyOptions,
  getSongDifficultyOptions,
  useRehearsalSongs,
} from '@/lib/rehearsal/logic';
import { RehearsalService } from '@/lib/rehearsal/service';
import type {
  CreateRehearsalMusicianDto,
  CreateRehearsalSongDto,
  CreateRehearsalVoicePartDto,
} from '@/lib/rehearsal/types';
import {
  InstrumentType,
  MusicalKey,
  SongDifficulty,
} from '@/lib/rehearsal/types';
import { UserCategory } from '@/lib/user/type';
import { useUsers } from '@/lib/user/useUsers';
import { useAuth } from '@/providers/AuthProvider';

import { UpdateRehearsalSongForm } from './UpdateRehearsalSongForm';

const rehearsalVoicePartOptions = [
  'Soprano',
  'Alto',
  'Tenor',
  'Bass',
  'Mezzo Soprano',
  'Baritone',
];

interface RehearsalSongManagerProps {
  songs: CreateRehearsalSongDto[];
  onSongsChange: (songs: CreateRehearsalSongDto[]) => void;
  performanceId: number;
  rehearsalData?: any;
  onRehearsalSave?: (rehearsalData: any) => Promise<any>;
  isRehearsalSaved?: boolean;
  rehearsalId?: number;
}
export const RehearsalSongManager: React.FC<RehearsalSongManagerProps> = ({
  songs,
  onSongsChange,
  performanceId,
  rehearsalData,
  onRehearsalSave,
  isRehearsalSaved = false,
  rehearsalId,
}) => {
  const { user } = useAuth();
  const [showAddSong, setShowAddSong] = useState(false);
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [songToDelete, setSongToDelete] = useState<{
    index: number;
    song: any;
  } | null>(null);
  const { users } = useUsers();

  // Check if user can manage songs (only lead category users)
  const canManageSongs = user?.categories?.includes(UserCategory.LEAD);

  const { songs: availableSongs, error: songsError } = useSongs();

  const {
    rehearsalSongs: separatedRehearsalSongs,
    error: rehearsalSongsError,
    fetchRehearsalSongs,
  } = useRehearsalSongs(rehearsalId || 0);

  const { isLoading: isPromoting } = usePromoteRehearsal();

  const rehearsalSongs = separatedRehearsalSongs?.rehearsalSongs || [];
  const rehearsalInfo = separatedRehearsalSongs?.rehearsalInfo;

  // Function to check if user can delete a specific song
  const canDeleteSong = (song: CreateRehearsalSongDto) => {
    if (!user || !canManageSongs) {
      return false;
    }

    const isRehearsalCreator = rehearsalInfo?.rehearsalLeadId === user.id;
    const canDelete =
      song.addedById === user.id ||
      isRehearsalCreator ||
      user.role === 'SUPER_ADMIN';

    return canDelete;
  };

  const convertedSongs: CreateRehearsalSongDto[] = rehearsalSongs.map(
    (song) => {
      // Try to get lead singers from multiple possible locations
      let leadSingerIds: number[] = [];

      // Check leadSingers array first
      if (
        song.rehearsalDetails.leadSingers &&
        Array.isArray(song.rehearsalDetails.leadSingers)
      ) {
        leadSingerIds = song.rehearsalDetails.leadSingers.map(
          (ls: any) => ls.id,
        );
      }
      // Check leadSinger array (singular) - using any to bypass TypeScript
      else if (
        (song.rehearsalDetails as any).leadSinger &&
        Array.isArray((song.rehearsalDetails as any).leadSinger)
      ) {
        leadSingerIds = (song.rehearsalDetails as any).leadSinger.map(
          (ls: any) => ls.id,
        );
      }
      // Check if there's a single leadSinger object
      else if (
        (song.rehearsalDetails as any).leadSinger &&
        !Array.isArray((song.rehearsalDetails as any).leadSinger)
      ) {
        leadSingerIds = [(song.rehearsalDetails as any).leadSinger.id];
      }
      // Check if there's a leadSingerId field
      else if ((song.rehearsalDetails as any).leadSingerId) {
        leadSingerIds = [(song.rehearsalDetails as any).leadSingerId];
      }

      const convertedSong = {
        songId: song.songLibrary.id,
        rehearsalSongId: song.rehearsalSongId,
        addedById: song.songLibrary.addedById || rehearsalInfo?.rehearsalLeadId,
        leadSingerIds,
        difficulty: song.rehearsalDetails.difficulty as SongDifficulty,
        needsWork: song.rehearsalDetails.needsWork,
        order: song.rehearsalDetails.order,
        timeAllocated: song.rehearsalDetails.timeAllocated,
        focusPoints: song.rehearsalDetails.focusPoints,
        notes: song.rehearsalDetails.notes,
        musicalKey: song.rehearsalDetails.musicalKey as MusicalKey,
        voiceParts: song.rehearsalDetails.voiceParts.map((vp) => ({
          voicePartType: vp.voicePartType,
          memberIds: vp.memberIds || vp.members?.map((m) => m.id) || [],
          needsWork: vp.needsWork,
          focusPoints: vp.focusPoints || '',
          notes: vp.notes || '',
        })),
        musicians: song.rehearsalDetails.musicians.map((m) => ({
          userId: m.user.id,
          instrument: m.instrument as InstrumentType,
          customInstrument: '',
          isAccompanist: m.isAccompanist || false,
          isSoloist: false,
          soloStartTime: 0,
          soloEndTime: 0,
          soloNotes: '',
          accompanimentNotes: '',
          needsPractice: false,
          practiceNotes: '',
          order: m.order || 1,
          timeAllocated: 0,
          notes: m.notes || '',
        })),
        chorusMemberIds: song.rehearsalDetails.chorusMembers.map((m) => m.id),
      };

      return convertedSong;
    },
  );

  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);
  const [showMusicianUserDropdown, setShowMusicianUserDropdown] =
    useState(false);
  const [showLeadSingerDropdown, setShowLeadSingerDropdown] = useState(false);
  const [showSongDropdown, setShowSongDropdown] = useState(false);

  const [voicePartDropdownStates, setVoicePartDropdownStates] = useState<
    Record<
      number,
      {
        showDropdown: boolean;
        searchTerm: string;
      }
    >
  >({});

  const activeDropdownRef = useRef<string | null>(null);

  const openDropdown = (dropdownName: string) => {
    setShowInstrumentDropdown(false);
    setShowMusicianUserDropdown(false);
    setShowLeadSingerDropdown(false);
    setShowSongDropdown(false);

    activeDropdownRef.current = dropdownName;

    switch (dropdownName) {
      case 'instrument':
        setShowInstrumentDropdown(true);
        break;
      case 'musicianUser':
        setShowMusicianUserDropdown(true);
        break;
      case 'leadSinger':
        setShowLeadSingerDropdown(true);
        break;
      case 'song':
        setShowSongDropdown(true);
        break;
      default:
        break;
    }
  };

  const closeDropdown = (dropdownName: string) => {
    if (activeDropdownRef.current === dropdownName) {
      activeDropdownRef.current = null;
      switch (dropdownName) {
        case 'instrument':
          setShowInstrumentDropdown(false);
          break;
        case 'musicianUser':
          setShowMusicianUserDropdown(false);
          break;
        case 'leadSinger':
          setShowLeadSingerDropdown(false);
          break;
        case 'song':
          setShowSongDropdown(false);
          break;
        default:
          break;
      }
    }
  };

  const openVoicePartDropdown = (voicePartIndex: number) => {
    setVoicePartDropdownStates((prev) => {
      const newState: Record<
        number,
        { showDropdown: boolean; searchTerm: string }
      > = {};
      Object.keys(prev).forEach((key) => {
        const index = parseInt(key, 10);
        newState[index] = {
          showDropdown: false,
          searchTerm: prev[index]?.searchTerm || '',
        };
      });
      return newState;
    });

    // Open the specific voice part dropdown
    setVoicePartDropdownStates((prev) => ({
      ...prev,
      [voicePartIndex]: {
        showDropdown: true,
        searchTerm: prev[voicePartIndex]?.searchTerm || '',
      },
    }));
  };

  const closeVoicePartDropdown = (voicePartIndex: number) => {
    setVoicePartDropdownStates((prev) => ({
      ...prev,
      [voicePartIndex]: {
        showDropdown: false,
        searchTerm: prev[voicePartIndex]?.searchTerm || '',
      },
    }));
  };

  const updateVoicePartSearchTerm = (
    voicePartIndex: number,
    searchTerm: string,
  ) => {
    setVoicePartDropdownStates((prev) => ({
      ...prev,
      [voicePartIndex]: {
        ...prev[voicePartIndex],
        searchTerm,
        showDropdown: true,
      },
    }));
  };

  const getVoicePartDropdownState = (voicePartIndex: number) => {
    return (
      voicePartDropdownStates[voicePartIndex] || {
        showDropdown: false,
        searchTerm: '',
      }
    );
  };

  // Promotion dialog state removed as it's not used

  const [newSong, setNewSong] = useState<CreateRehearsalSongDto>({
    songId: 0,
    leadSingerIds: [], // Changed from leadSingerId to support multiple lead singers
    difficulty: SongDifficulty.INTERMEDIATE,
    needsWork: false,
    order: songs.length + 1,
    timeAllocated: 30,
    focusPoints: '',
    notes: '',
    musicalKey: MusicalKey.C,
    voiceParts: [],
    musicians: [],
    chorusMemberIds: [],
  });

  const [selectedLeadSingerIds, setSelectedLeadSingerIds] = useState<number[]>(
    [],
  );
  const [leadSingerSearchTerm, setLeadSingerSearchTerm] = useState('');
  const [musicianUserSearchTerm, setMusicianUserSearchTerm] = useState('');

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [songToUpdate, setSongToUpdate] =
    useState<CreateRehearsalSongDto | null>(null);
  const [songTitle, setSongTitle] = useState<string>('');
  const [songComposer, setSongComposer] = useState<string>('');

  const previousDataRef = useRef<string>('');

  const resetForm = () => {
    const initialSong: CreateRehearsalSongDto = {
      songId: 0,
      leadSingerIds: [], // Changed from leadSingerId to support multiple lead singers
      difficulty: SongDifficulty.INTERMEDIATE,
      needsWork: false,
      order: songs.length + 1,
      timeAllocated: 30,
      focusPoints: '',
      notes: '',
      musicalKey: MusicalKey.C,
      voiceParts: [],
      musicians: [],
      chorusMemberIds: [],
    };
    setNewSong(initialSong);
    setSelectedLeadSingerIds([]); // Reset selected lead singers
  };

  // Synchronize selectedLeadSingerIds with newSong.leadSingerIds
  useEffect(() => {
    setSelectedLeadSingerIds(newSong.leadSingerIds || []);
  }, [newSong.leadSingerIds]);

  const getSelectedSongTitle = (songId: number) => {
    const song = availableSongs.find((s) => parseInt(s.id, 10) === songId);
    if (song) {
      return song.title;
    }
    return 'Chanson inconnue';
  };

  const handleLeadSingerToggle = (userId: number) => {
    setSelectedLeadSingerIds((prev) => {
      if (prev.includes(userId)) {
        const newIds = prev.filter((id) => id !== userId);
        setNewSong((prevSong) => ({ ...prevSong, leadSingerIds: newIds }));
        return newIds;
      }
      const newIds = [...prev, userId];
      setNewSong((prevSong) => ({ ...prevSong, leadSingerIds: newIds }));
      return newIds;
    });
  };

  const removeLeadSinger = (userId: number) => {
    setSelectedLeadSingerIds((prev) => {
      const newIds = prev.filter((id) => id !== userId);
      setNewSong((prevSong) => ({ ...prevSong, leadSingerIds: newIds }));
      return newIds;
    });
  };

  const handleUpdateSuccess = async () => {
    // Refresh data from API to ensure we have the latest data from the backend
    if (fetchRehearsalSongs) {
      await fetchRehearsalSongs();
    }

    setShowUpdateForm(false);
    setSongToUpdate(null);
  };

  const handleUpdateCancel = () => {
    setShowUpdateForm(false);
    setSongToUpdate(null);
    setSongTitle('');
    setSongComposer('');
  };

  useEffect(() => {
    if (
      rehearsalSongs &&
      Array.isArray(rehearsalSongs) &&
      rehearsalSongs.length > 0
    ) {
      const mappedSongs = rehearsalSongs.map((separatedSong) => {
        const convertedSong: CreateRehearsalSongDto = {
          songId: separatedSong.songLibrary.id,
          leadSingerIds:
            separatedSong.rehearsalDetails.leadSingers?.map((ls) => ls.id) ||
            [], // Use only leadSingers array
          difficulty: separatedSong.rehearsalDetails
            .difficulty as SongDifficulty,
          needsWork: separatedSong.rehearsalDetails.needsWork,
          order: separatedSong.rehearsalDetails.order,
          timeAllocated: separatedSong.rehearsalDetails.timeAllocated,
          focusPoints: separatedSong.rehearsalDetails.focusPoints,
          notes: separatedSong.rehearsalDetails.notes,
          musicalKey: separatedSong.rehearsalDetails.musicalKey as MusicalKey,
          voiceParts: separatedSong.rehearsalDetails.voiceParts.map((vp) => ({
            voicePartType: vp.voicePartType,
            memberIds: vp.memberIds || [],
            needsWork: vp.needsWork,
            focusPoints: vp.focusPoints,
            notes: vp.notes,
          })),
          musicians: separatedSong.rehearsalDetails.musicians.map((m) => ({
            userId: m.userId,
            instrument: m.instrument,
            customInstrument: undefined,
            isAccompanist: m.isAccompanist,
            isSoloist: false,
            soloStartTime: 0,
            soloEndTime: 0,
            soloNotes: '',
            accompanimentNotes: '',
            needsPractice: false,
            practiceNotes: '',
            order: m.order,
            timeAllocated: 0,
            notes: m.notes,
          })),
          chorusMemberIds: separatedSong.rehearsalDetails.chorusMembers.map(
            (cm) => cm.id,
          ),
        };

        return convertedSong;
      });

      const dataString = JSON.stringify(mappedSongs);
      if (dataString !== previousDataRef.current) {
        previousDataRef.current = dataString;
        onSongsChange(mappedSongs);
      }
    } else if (rehearsalId && rehearsalId > 0) {
      const emptyDataString = JSON.stringify([]);
      if (emptyDataString !== previousDataRef.current) {
        previousDataRef.current = emptyDataString;
        onSongsChange([]);
      }
    } else if (songs && Array.isArray(songs) && songs.length > 0) {
      const sanitizedSongs = songs.map((song) => {
        return {
          ...song,
          voiceParts:
            song.voiceParts?.map((voicePart) => {
              const isValid = rehearsalVoicePartOptions.includes(
                voicePart.voicePartType,
              );
              return {
                ...voicePart,
                voicePartType: isValid ? voicePart.voicePartType : 'Soprano',
              };
            }) || [],
          musicians: song.musicians || [],
        };
      });

      const fallbackDataString = JSON.stringify(sanitizedSongs);
      if (fallbackDataString !== previousDataRef.current) {
        previousDataRef.current = fallbackDataString;
        onSongsChange(sanitizedSongs);
      }
    } else {
      const emptyDataString = JSON.stringify([]);
      if (emptyDataString !== previousDataRef.current) {
        previousDataRef.current = emptyDataString;
        onSongsChange([]);
      }
    }
  }, [rehearsalSongs, rehearsalInfo, rehearsalId, songs]);

  const handleAddSong = async () => {
    if (!newSong.songId) {
      toast.error('Veuillez sélectionner une chanson');
      return;
    }

    if (!rehearsalId || rehearsalId <= 0) {
      toast.error(
        "Impossible d'ajouter des chansons: la répétition doit d'abord être sauvegardée.\n\nVeuillez cliquer sur \"Sauvegarder la répétition\" avant d'ajouter des chansons.",
      );
      return;
    }

    const songToAdd = {
      ...newSong,
      order: songs.length + 1,
    };

    await RehearsalService.addSongToRehearsal(rehearsalId, songToAdd);

    if (fetchRehearsalSongs) {
      await fetchRehearsalSongs();
    }

    toast.success('Chanson ajoutée avec succès à la répétition');
    resetForm();
    setShowAddSong(false);
  };

  const handleEditSong = (index: number) => {
    const songToEdit =
      convertedSongs.length > 0 ? convertedSongs[index] : songs[index];

    if (songToEdit) {
      const songDetails = availableSongs.find(
        (s) => parseInt(s.id, 10) === songToEdit.songId,
      );
      const title = songDetails?.title || 'Titre non disponible';
      const composer = songDetails?.composer || 'Compositeur non disponible';

      const sanitizedSong = {
        ...songToEdit,
        leadSingerIds: songToEdit.leadSingerIds || [],
        voiceParts: songToEdit.voiceParts?.map((voicePart) => ({
          ...voicePart,
          voicePartType: rehearsalVoicePartOptions.includes(
            voicePart.voicePartType,
          )
            ? voicePart.voicePartType
            : 'Soprano',
        })),
      };

      setSongToUpdate(sanitizedSong);
      setSongTitle(title);
      setSongComposer(composer);
      setShowUpdateForm(true);
    }
  };

  const handleUpdateSong = async () => {
    if (editingSongIndex !== null) {
      const songToUpdateData = songs[editingSongIndex];

      if (!songToUpdateData) {
        toast.error('Chanson introuvable');
        return;
      }

      if (!rehearsalId || rehearsalId <= 0) {
        toast.error(
          'Aucune répétition sélectionnée. Impossible de mettre à jour la chanson.',
        );
        return;
      }

      const updateData = {
        leadSingerIds: newSong.leadSingerIds,
        difficulty: newSong.difficulty,
        needsWork: newSong.needsWork,
        order: newSong.order,
        timeAllocated: newSong.timeAllocated,
        focusPoints: newSong.focusPoints,
        notes: newSong.notes,
        musicalKey: newSong.musicalKey,
        voiceParts: newSong.voiceParts,
        musicians: newSong.musicians,
        chorusMemberIds: newSong.chorusMemberIds,
      };

      await RehearsalService.updateRehearsalSong(
        rehearsalId,
        songToUpdateData.songId,
        updateData,
      );

      if (fetchRehearsalSongs) {
        await fetchRehearsalSongs();
      }

      toast.success('Chanson mise à jour avec succès');
      setEditingSongIndex(null);
      setShowAddSong(false);
      resetForm();
    }
  };

  const handleDeleteSong = (index: number) => {
    const songsToUse = convertedSongs.length > 0 ? convertedSongs : songs;
    const songToDeleteData = songsToUse[index];

    if (!songToDeleteData) {
      toast.error('Chanson introuvable');
      return;
    }

    if (!rehearsalId || rehearsalId <= 0) {
      toast.error(
        'Aucune répétition sélectionnée. Impossible de supprimer la chanson.',
      );
      return;
    }

    setSongToDelete({ index, song: songToDeleteData });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;

    try {
      const idToUse =
        songToDelete.song.rehearsalSongId || songToDelete.song.songId;

      await RehearsalService.deleteRehearsalSong(rehearsalId!, idToUse);

      if (fetchRehearsalSongs) {
        await fetchRehearsalSongs();
      }

      toast.success('Chanson supprimée avec succès');

      setShowDeleteConfirm(false);
      setSongToDelete(null);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(
          "Permission refusée: Vous n'avez pas le droit de supprimer cette chanson",
        );
      } else if (error.response?.status === 404) {
        toast.error('Chanson introuvable');
      } else if (error.response?.status === 401) {
        toast.error('Authentification requise');
      } else {
        toast.error('Erreur lors de la suppression de la chanson');
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSongToDelete(null);
  };

  const addVoicePart = () => {
    const newVoicePart: CreateRehearsalVoicePartDto = {
      voicePartType: 'Soprano',
      memberIds: [],
      needsWork: false,
      focusPoints: '',
      notes: '',
    };
    setNewSong((prev) => {
      const updatedSong = {
        ...prev,
        voiceParts: [...prev.voiceParts, newVoicePart],
      };
      return updatedSong;
    });
  };

  const addMusician = () => {
    const newMusician: CreateRehearsalMusicianDto = {
      userId: 0,
      instrument: InstrumentType.PIANO,
      customInstrument: '',
      isAccompanist: false,
      isSoloist: false,
      soloStartTime: 0,
      soloEndTime: 0,
      soloNotes: '',
      accompanimentNotes: '',
      needsPractice: false,
      practiceNotes: '',
      order: newSong.musicians.length + 1,
      timeAllocated: 0,
      notes: '',
    };
    setNewSong((prev) => {
      const updatedSong = {
        ...prev,
        musicians: [...prev.musicians, newMusician],
      };
      return updatedSong;
    });
  };

  const updateVoicePart = (index: number, field: string, value: any) => {
    const updatedVoiceParts = [...newSong.voiceParts];
    const currentVoicePart = updatedVoiceParts[index];
    if (currentVoicePart) {
      if (
        field === 'voicePartType' ||
        field === 'memberIds' ||
        field === 'needsWork' ||
        field === 'focusPoints' ||
        field === 'notes'
      ) {
        const updatedVoicePart = { ...currentVoicePart, [field]: value };
        updatedVoiceParts[index] = updatedVoicePart;
        setNewSong((prev) => ({ ...prev, voiceParts: updatedVoiceParts }));
      }
    }
  };

  const updateMusician = (index: number, field: string, value: any) => {
    const updatedMusicians = [...newSong.musicians];
    const currentMusician = updatedMusicians[index];
    if (currentMusician) {
      if (
        field === 'userId' ||
        field === 'instrument' ||
        field === 'customInstrument' ||
        field === 'isAccompanist' ||
        field === 'isSoloist' ||
        field === 'soloStartTime' ||
        field === 'soloEndTime' ||
        field === 'soloNotes' ||
        field === 'accompanimentNotes' ||
        field === 'needsPractice' ||
        field === 'practiceNotes' ||
        field === 'order' ||
        field === 'timeAllocated' ||
        field === 'notes'
      ) {
        const updatedMusician = { ...currentMusician, [field]: value };
        updatedMusicians[index] = updatedMusician;
        setNewSong((prev) => ({ ...prev, musicians: updatedMusicians }));
      }
    }
  };

  const removeVoicePart = (index: number) => {
    const updatedVoiceParts = newSong.voiceParts.filter((_, i) => i !== index);

    setNewSong((prev) => ({ ...prev, voiceParts: updatedVoiceParts }));
  };

  const removeMusician = (index: number) => {
    const updatedMusicians = newSong.musicians.filter((_, i) => i !== index);

    setNewSong((prev) => ({ ...prev, musicians: updatedMusicians }));
  };

  const getSelectedUserName = (userId: number) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (selectedUser) {
      return `${selectedUser.firstName} ${selectedUser.lastName}`;
    }
    return 'Utilisateur inconnu';
  };

  const getTotalTime = () => {
    const effectiveSongs = convertedSongs.length > 0 ? convertedSongs : songs;
    return effectiveSongs.reduce(
      (total, song) => total + (song.timeAllocated || 0),
      0,
    );
  };

  const ensureRehearsalSaved = async () => {
    if (isRehearsalSaved) {
      return true;
    }

    if (!onRehearsalSave || !rehearsalData) {
      return false;
    }

    const result = await onRehearsalSave(rehearsalData);
    return result && result.id;
  };

  // ============================================================================
  // PROMOTION FUNCTIONALITY
  // ============================================================================

  const canPromote = () => {
    if (!rehearsalId || rehearsalId <= 0) return false;
    if (!performanceId || performanceId <= 0) return false;
    if (!rehearsalInfo) return false;
    if (rehearsalInfo.performanceId !== performanceId) return false;

    const hasSongs = convertedSongs.length > 0 || songs.length > 0;
    if (!hasSongs) return false;

    return true;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Chansons de la répétition
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FaMusic className="text-blue-500" />
              <span>
                {(() => {
                  const songCount =
                    convertedSongs.length > 0
                      ? convertedSongs.length
                      : songs.length;
                  return `${songCount} chanson${songCount !== 1 ? 's' : ''}`;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-green-500" />
              <span>{getTotalTime()} min total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canManageSongs && (
            <button
              type="button"
              onClick={async (event) => {
                try {
                  const button = event.target as HTMLButtonElement;
                  button.disabled = true;
                  button.textContent = 'Sauvegarde...';

                  const rehearsalSaved = await ensureRehearsalSaved();

                  if (rehearsalSaved) {
                    setShowAddSong(true);
                  } else {
                    toast.error(
                      'Erreur lors de la sauvegarde de la répétition. Veuillez réessayer.',
                    );
                  }
                } catch (error) {
                  toast.error(
                    'Erreur lors de la sauvegarde de la répétition. Veuillez réessayer.',
                  );
                } finally {
                  const button = event.target as HTMLButtonElement;
                  button.disabled = false;
                  button.textContent = 'Ajouter une chanson';
                }
              }}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlus />
              Ajouter une chanson
            </button>
          )}

          {canPromote() && (
            <button
              type="button"
              onClick={() => {
                toast.success('Fonctionnalité de promotion non disponible');
              }}
              disabled={isPromoting}
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaMicrophone />
              {isPromoting ? 'Promotion...' : 'Promouvoir vers Performance'}
            </button>
          )}
        </div>
      </div>

      {(() => {
        if (rehearsalSongsError) {
          return (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
              <p className="mb-2 text-red-500">
                Erreur lors du chargement des chansons de la répétition
              </p>
              <p className="text-sm text-gray-500">{rehearsalSongsError}</p>
            </div>
          );
        }
        if (songsError) {
          return (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
              <p className="mb-2 text-red-500">
                Erreur lors du chargement des chansons
              </p>
              <p className="text-sm text-gray-500">{songsError}</p>
            </div>
          );
        }
        if (!rehearsalId || rehearsalId <= 0) {
          return (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
              <FaMusic className="mx-auto mb-4 size-12 text-gray-400" />
              <p className="mb-2 text-gray-500">
                Aucune répétition sélectionnée
              </p>
              <p className="text-sm text-gray-400">
                Sélectionnez une répétition pour voir ses chansons
              </p>
            </div>
          );
        }

        if (convertedSongs.length > 0 || songs.length > 0) {
          const songsToRender =
            convertedSongs.length > 0 ? convertedSongs : songs;

          return (
            <div className="space-y-3">
              {songsToRender.map((song, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        #{song.order}
                      </span>
                      <FaMusic className="text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {getSelectedSongTitle(song.songId)}
                      </span>
                      {rehearsalInfo && convertedSongs.length > 0 && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          📚 Bibliothèque
                        </span>
                      )}
                      {convertedSongs.length > 0 && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          🎯 Répétition
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(song.difficulty)}`}
                      >
                        🎯 {song.difficulty} (répétition)
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getMusicalKeyColor()}`}
                      >
                        🎵 {song.musicalKey} (répétition)
                      </span>
                      {song.needsWork && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Travail nécessaire
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        <FaClock className="mr-1 inline" />
                        {song.timeAllocated} min
                      </span>
                      {(() => {
                        const canDelete = canDeleteSong(song);
                        return canDelete;
                      })() && (
                        <button
                          type="button"
                          onClick={() => handleEditSong(index)}
                          className="rounded p-2 text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <FaEdit />
                        </button>
                      )}
                      {(() => {
                        const canDelete = canDeleteSong(song);
                        return canDelete;
                      })() && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteSong(index);
                          }}
                          className="rounded p-2 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
                    <div>
                      <span className="font-medium">
                        Chanteur(s) principal(aux):
                      </span>
                      <span className="ml-2">
                        {song.leadSingerIds && song.leadSingerIds.length > 0 ? (
                          song.leadSingerIds
                            .map((id) => getSelectedUserName(id))
                            .join(', ')
                        ) : (
                          <span className="italic text-gray-400">
                            Non assigné
                          </span>
                        )}
                      </span>
                    </div>
                    {song.focusPoints && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Points de focus:</span>
                        <span className="ml-2">{song.focusPoints}</span>
                      </div>
                    )}
                    {song.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Notes:</span>
                        <span className="ml-2">{song.notes}</span>
                      </div>
                    )}
                  </div>

                  {song.voiceParts && song.voiceParts.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="mb-2 flex items-center gap-2">
                        <FaUsers className="text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Parties vocales
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {song.voiceParts.map((vp, vpIndex) => (
                          <span
                            key={vpIndex}
                            className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800"
                          >
                            {vp.voicePartType} ({vp.memberIds?.length || 0}{' '}
                            membres)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {song.musicians && song.musicians.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-2 flex items-center gap-2">
                        <FaMicrophone className="text-green-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Musiciens
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {song.musicians.map((musician, mIndex) => (
                          <span
                            key={mIndex}
                            className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800"
                          >
                            {musician.userId
                              ? getSelectedUserName(musician.userId)
                              : 'Non assigné'}{' '}
                            - {musician.instrument}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return (
          <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
            <FaMusic className="mx-auto mb-4 size-12 text-gray-400" />
            <p className="mb-2 text-gray-500">Aucune chanson ajoutée</p>
            <p className="text-sm text-gray-400">
              Commencez par ajouter des chansons à votre répétition
            </p>
          </div>
        );
      })()}

      {showAddSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[98%] overflow-y-auto rounded-lg bg-white p-6 shadow-xl md:w-[80%]">
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingSongIndex !== null
                  ? 'Modifier la chanson'
                  : 'Ajouter une chanson'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddSong(false);
                  setEditingSongIndex(null);
                  resetForm();
                }}
                className="rounded text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Chanson de la bibliothèque *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        newSong.songId === 0
                          ? ''
                          : getSelectedSongTitle(newSong.songId)
                      }
                      onChange={() => {
                        openDropdown('song');
                      }}
                      placeholder="Sélectionnez une chanson de la bibliothèque..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => openDropdown('song')}
                      onBlur={() =>
                        setTimeout(() => closeDropdown('song'), 200)
                      }
                    />
                    {showSongDropdown && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                        {songsError ? (
                          <div className="px-3 py-2 text-sm text-red-500">
                            Erreur: {songsError}
                          </div>
                        ) : availableSongs.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Aucune chanson disponible dans la bibliothèque
                          </div>
                        ) : (
                          <div className="border-b border-gray-200 p-2 text-xs text-gray-500">
                            Chansons de la bibliothèque - Sélectionnez une
                            chanson pour l&apos;ajouter à cette répétition
                          </div>
                        )}
                        {availableSongs.map((song) => (
                          <div
                            key={song.id}
                            className="cursor-pointer border-b border-gray-100 px-3 py-2 hover:bg-blue-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const songId = parseInt(song.id, 10);
                              setNewSong((prev) => {
                                return {
                                  ...prev,
                                  songId,
                                  voiceParts: [],
                                  musicians: [],
                                  focusPoints: '',
                                  notes: '',
                                };
                              });
                              closeDropdown('song');
                            }}
                          >
                            <div className="font-medium">{song.title}</div>
                            <div className="text-sm text-gray-600">
                              Composé par {song.composer}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Chanteur(s) principal(aux) pour cette répétition
                  </label>

                  <div className="mb-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedLeadSingerIds.map((singerId) => {
                        const singer = users.find((u) => u.id === singerId);
                        return singer ? (
                          <span
                            key={singerId}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"
                          >
                            {singer.firstName} {singer.lastName}
                            <button
                              type="button"
                              onClick={() => removeLeadSinger(singerId)}
                              className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={leadSingerSearchTerm}
                      onChange={(e) => {
                        setLeadSingerSearchTerm(e.target.value);
                        openDropdown('leadSinger');
                      }}
                      placeholder="Tapez pour rechercher des chanteurs..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onFocus={() => openDropdown('leadSinger')}
                      onBlur={() =>
                        setTimeout(() => closeDropdown('leadSinger'), 200)
                      }
                    />
                    {showLeadSingerDropdown && (
                      <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                        {users
                          .filter(
                            (u) =>
                              !selectedLeadSingerIds.includes(u.id) &&
                              `${u.firstName} ${u.lastName}`
                                .toLowerCase()
                                .includes(leadSingerSearchTerm.toLowerCase()),
                          )
                          .sort((a, b) =>
                            `${a.firstName} ${a.lastName}`.localeCompare(
                              `${b.firstName} ${b.lastName}`,
                            ),
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="flex cursor-pointer items-center px-3 py-2 hover:bg-blue-50"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLeadSingerToggle(u.id);
                                setLeadSingerSearchTerm('');
                              }}
                            >
                              <span className="text-sm text-gray-700">
                                {u.firstName} {u.lastName}
                              </span>
                            </div>
                          ))}
                        {users.filter(
                          (u) =>
                            !selectedLeadSingerIds.includes(u.id) &&
                            `${u.firstName} ${u.lastName}`
                              .toLowerCase()
                              .includes(leadSingerSearchTerm.toLowerCase()),
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Aucun chanteur trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Niveau de difficulté pour cette répétition
                  </label>
                  <select
                    value={newSong.difficulty}
                    onChange={(e) =>
                      setNewSong((prev) => ({
                        ...prev,
                        difficulty: e.target.value as SongDifficulty,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getSongDifficultyOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Clé musicale pour cette répétition
                  </label>
                  <select
                    value={newSong.musicalKey}
                    onChange={(e) =>
                      setNewSong((prev) => ({
                        ...prev,
                        musicalKey: e.target.value as MusicalKey,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getMusicalKeyOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Temps alloué pour cette répétition (minutes)
                  </label>
                  <input
                    type="number"
                    value={newSong.timeAllocated}
                    onChange={(e) =>
                      setNewSong((prev) => ({
                        ...prev,
                        timeAllocated: Number(e.target.value),
                      }))
                    }
                    min="5"
                    max="120"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newSong.needsWork}
                      onChange={(e) =>
                        setNewSong((prev) => ({
                          ...prev,
                          needsWork: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Nécessite du travail dans cette répétition
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Points de focus pour cette répétition
                  </label>
                  <textarea
                    value={newSong.focusPoints}
                    onChange={(e) =>
                      setNewSong((prev) => ({
                        ...prev,
                        focusPoints: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Quels aspects de cette chanson doivent être travaillés ?"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes pour cette répétition
                  </label>
                  <textarea
                    value={newSong.notes}
                    onChange={(e) =>
                      setNewSong((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Notes spécifiques à cette répétition..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Voice Parts Management */}
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Attaque-chant
                  </h4>
                  <button
                    type="button"
                    onClick={addVoicePart}
                    className="flex items-center gap-2 rounded-md bg-purple-100 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <FaPlus />
                    Attaque-chant
                  </button>
                </div>

                {newSong.voiceParts.map((voicePart, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        Attaque-chant #{index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeVoicePart(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Type de partie
                        </label>
                        <select
                          value={voicePart.voicePartType}
                          onChange={(e) =>
                            updateVoicePart(
                              index,
                              'voicePartType',
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="Soprano">Soprano</option>
                          <option value="Alto">Alto</option>
                          <option value="Ténor">Ténor</option>
                          <option value="Basse">Basse</option>
                          <option value="Mezzo Soprano">Mezzo Soprano</option>
                          <option value="Baryton">Baryton</option>
                        </select>
                      </div>

                      <div className="">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Membres
                        </label>

                        {/* Selected Members Display */}
                        <div className="">
                          <div className="flex flex-wrap gap-2">
                            {voicePart.memberIds.map((memberId) => {
                              const member = users.find(
                                (u) => u.id === memberId,
                              );
                              return member ? (
                                <span
                                  key={memberId}
                                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"
                                >
                                  {member.firstName} {member.lastName}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedMemberIds =
                                        voicePart.memberIds?.filter(
                                          (id) => id !== memberId,
                                        ) || [];
                                      updateVoicePart(
                                        index,
                                        'memberIds',
                                        updatedMemberIds,
                                      );
                                    }}
                                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>

                        {/* Member Selection Dropdown */}
                        <div className="relative">
                          <input
                            type="text"
                            value={getVoicePartDropdownState(index).searchTerm}
                            onChange={(e) => {
                              updateVoicePartSearchTerm(index, e.target.value);
                            }}
                            placeholder="Tapez pour rechercher des membres..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onFocus={() => openVoicePartDropdown(index)}
                            onBlur={() =>
                              setTimeout(
                                () => closeVoicePartDropdown(index),
                                200,
                              )
                            }
                          />
                          {getVoicePartDropdownState(index).showDropdown && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              {users
                                .filter((u) =>
                                  `${u.firstName} ${u.lastName}`
                                    .toLowerCase()
                                    .includes(
                                      getVoicePartDropdownState(
                                        index,
                                      ).searchTerm.toLowerCase(),
                                    ),
                                )
                                .sort((a, b) =>
                                  `${a.firstName} ${a.lastName}`.localeCompare(
                                    `${b.firstName} ${b.lastName}`,
                                  ),
                                )
                                .map((u) => (
                                  <div
                                    key={u.id}
                                    className={`flex cursor-pointer items-center px-3 py-2 ${
                                      voicePart.memberIds?.includes(u.id)
                                        ? 'bg-blue-100 hover:bg-blue-200'
                                        : 'hover:bg-blue-50'
                                    }`}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const currentMemberIds =
                                        voicePart.memberIds || [];
                                      const isAlreadySelected =
                                        currentMemberIds.includes(u.id);

                                      let updatedMemberIds;
                                      if (isAlreadySelected) {
                                        // Remove member if already selected
                                        updatedMemberIds =
                                          currentMemberIds.filter(
                                            (id) => id !== u.id,
                                          );
                                      } else {
                                        // Add member if not selected
                                        updatedMemberIds = [
                                          ...currentMemberIds,
                                          u.id,
                                        ];
                                      }

                                      updateVoicePart(
                                        index,
                                        'memberIds',
                                        updatedMemberIds,
                                      );
                                      updateVoicePartSearchTerm(index, '');
                                      // Don't close dropdown to allow multiple selections
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        voicePart.memberIds?.includes(u.id) ||
                                        false
                                      }
                                      readOnly
                                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                      {u.firstName} {u.lastName}
                                    </span>
                                  </div>
                                ))}
                              {users.filter(
                                (u) =>
                                  !voicePart.memberIds?.includes(u.id) &&
                                  `${u.firstName} ${u.lastName}`
                                    .toLowerCase()
                                    .includes(
                                      getVoicePartDropdownState(
                                        index,
                                      ).searchTerm.toLowerCase(),
                                    ),
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Aucun membre trouvé
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Points de focus
                        </label>
                        <textarea
                          value={voicePart.focusPoints || ''}
                          onChange={(e) =>
                            updateVoicePart(
                              index,
                              'focusPoints',
                              e.target.value,
                            )
                          }
                          rows={1}
                          placeholder="Points spécifiques à travailler pour cette partie vocale..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </div>

                      <div className="">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={voicePart.needsWork || false}
                            onChange={(e) =>
                              updateVoicePart(
                                index,
                                'needsWork',
                                e.target.checked,
                              )
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Nécessite du travail
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Musicians Management */}
              <div className="border-t border-gray-200 pt-6">
                {/* 
                  REHEARSAL MUSICIANS - These are rehearsal-specific assignments
                  Each rehearsal can assign different musicians to different instruments
                  Practice notes and time allocations are specific to this rehearsal
                */}
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Defense</h4>
                  <button
                    type="button"
                    onClick={addMusician}
                    className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FaPlus />
                    Defense
                  </button>
                </div>

                {newSong.musicians.map((musician, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="font-medium text-gray-900">
                        Musicien #{index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeMusician(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Utilisateur
                          {!musician.userId && (
                            <span className="ml-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                              Non assigné
                            </span>
                          )}
                        </label>

                        {/* Selected User Display */}
                        <div className="mb-3">
                          {musician.userId && musician.userId > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800">
                                {getSelectedUserName(musician.userId)}
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateMusician(index, 'userId', 0);
                                    setMusicianUserSearchTerm('');
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                >
                                  ×
                                </button>
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              Aucun utilisateur sélectionné
                            </p>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={musicianUserSearchTerm}
                            onChange={(e) => {
                              setMusicianUserSearchTerm(e.target.value);
                              openDropdown('musicianUser');
                            }}
                            placeholder="Tapez pour rechercher un utilisateur..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onFocus={() => openDropdown('musicianUser')}
                            onBlur={() =>
                              setTimeout(
                                () => closeDropdown('musicianUser'),
                                200,
                              )
                            }
                          />
                          {showMusicianUserDropdown && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              <div className="border-b border-gray-200 p-2 text-xs text-gray-500">
                                Sélectionnez un musicien
                              </div>
                              {users
                                .filter((u) =>
                                  `${u.firstName} ${u.lastName}`
                                    .toLowerCase()
                                    .includes(
                                      musicianUserSearchTerm.toLowerCase(),
                                    ),
                                )
                                .sort((a, b) =>
                                  `${a.firstName} ${a.lastName}`.localeCompare(
                                    `${b.firstName} ${b.lastName}`,
                                  ),
                                )
                                .map((u) => (
                                  <div
                                    key={u.id}
                                    className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateMusician(index, 'userId', u.id);
                                      setMusicianUserSearchTerm('');
                                      closeDropdown('musicianUser');
                                    }}
                                  >
                                    <span className="text-sm text-gray-700">
                                      {u.firstName} {u.lastName}
                                    </span>
                                  </div>
                                ))}
                              {users.filter((u) =>
                                `${u.firstName} ${u.lastName}`
                                  .toLowerCase()
                                  .includes(
                                    musicianUserSearchTerm.toLowerCase(),
                                  ),
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Aucun utilisateur trouvé
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Instrument
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={musician.instrument}
                            onChange={(e) => {
                              updateMusician(
                                index,
                                'instrument',
                                e.target.value,
                              );
                              openDropdown('instrument');
                            }}
                            placeholder="Tapez pour rechercher un instrument..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onFocus={() => openDropdown('instrument')}
                            onBlur={() =>
                              setTimeout(() => closeDropdown('instrument'), 200)
                            }
                          />
                          {showInstrumentDropdown && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                              <div className="border-b border-gray-200 p-2 text-xs text-gray-500">
                                Sélectionnez un instrument
                              </div>
                              {getInstrumentOptions()
                                .filter((option) =>
                                  option.label
                                    .toLowerCase()
                                    .includes(
                                      musician.instrument.toLowerCase(),
                                    ),
                                )
                                .map((option) => (
                                  <div
                                    key={option.value}
                                    className="cursor-pointer px-3 py-2 hover:bg-blue-50"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateMusician(
                                        index,
                                        'instrument',
                                        option.value,
                                      );
                                      closeDropdown('instrument');
                                    }}
                                  >
                                    <span className="text-sm text-gray-700">
                                      {option.label}
                                    </span>
                                  </div>
                                ))}
                              {getInstrumentOptions().filter((option) =>
                                option.label
                                  .toLowerCase()
                                  .includes(musician.instrument.toLowerCase()),
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Aucun instrument trouvé
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          value={musician.notes || ''}
                          onChange={(e) =>
                            updateMusician(index, 'notes', e.target.value)
                          }
                          rows={1}
                          placeholder="Notes sur ce musicien..."
                          className="w-full rounded-md border border-gray-300 px-3 py-2"
                        />
                      </div>

                      <div className="">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={musician.needsPractice || false}
                              onChange={(e) =>
                                updateMusician(
                                  index,
                                  'needsPractice',
                                  e.target.checked,
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Nécessite de la pratique
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Actions */}
              <div className="border-t border-gray-200 pt-6">
                {/* Warning about unassigned musicians */}
                {newSong.musicians.some((m) => !m.userId || m.userId === 0) && (
                  <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Attention: Les musiciens sans utilisateur assigné ne
                      seront pas sauvegardés. Veuillez assigner un utilisateur à
                      chaque musicien ou les supprimer.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSong(false);
                      setEditingSongIndex(null);
                      resetForm();
                    }}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSongIndex !== null) {
                        handleUpdateSong();
                      } else {
                        handleAddSong();
                      }
                    }}
                    disabled={
                      editingSongIndex !== null
                        ? false
                        : !newSong.songId || newSong.leadSingerIds.length === 0
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {editingSongIndex !== null
                      ? 'Confirmer la modification'
                      : "Confirmer l'ajout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Song Form */}
      {(() => {
        return showUpdateForm && songToUpdate && rehearsalId;
      })() &&
        songToUpdate && (
          <UpdateRehearsalSongForm
            rehearsalId={rehearsalId!}
            songId={songToUpdate.songId}
            rehearsalSongId={songToUpdate.rehearsalSongId!}
            initialData={songToUpdate}
            songTitle={songTitle}
            songComposer={songComposer}
            onSuccess={handleUpdateSuccess}
            onCancel={handleUpdateCancel}
          />
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && songToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-4 flex items-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100">
                  <FaTrash className="text-xl text-red-600" />
                </div>
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
              <p className="mb-6 text-center text-gray-600">
                Êtes-vous sûr de vouloir supprimer la chanson{' '}
                <span className="font-semibold text-gray-900">
                  &quot;{getSelectedSongTitle(songToDelete.song.songId)}&quot;
                </span>
                ?
              </p>
              <p className="mb-6 text-center text-sm text-red-600">
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
