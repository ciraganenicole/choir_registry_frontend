// ============================================================================
// REHEARSAL MODULE TYPES
// ============================================================================

import type { SongStatus } from '@/lib/library/logic';
import type { User } from '@/lib/user/type';

export enum RehearsalType {
  GENERAL_PRACTICE = 'General Practice',
  PERFORMANCE_PREPARATION = 'Performance Preparation',
  SONG_LEARNING = 'Song Learning',
  SECTIONAL_PRACTICE = 'Sectional Practice',
  FULL_ENSEMBLE = 'Full Ensemble',
  DRESS_REHEARSAL = 'Dress Rehearsal',
  OTHER = 'Other',
}

export enum RehearsalStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum MusicalKey {
  C = 'C',
  C_SHARP = 'C#',
  D = 'D',
  D_SHARP = 'D#',
  E = 'E',
  F = 'F',
  F_SHARP = 'F#',
  G = 'G',
  G_SHARP = 'G#',
  A = 'A',
  A_SHARP = 'A#',
  B = 'B',
}

export enum InstrumentType {
  // String Family
  PIANO = 'Piano',
  ELECTRIC_PIANO = 'Electric Piano',
  DIGITAL_PIANO = 'Digital Piano',
  KEYBOARD = 'Keyboard',
  SYNTHESIZER = 'Synthesizer',
  GUITAR = 'Guitar',
  ACOUSTIC_GUITAR = 'Acoustic Guitar',
  ELECTRIC_GUITAR = 'Electric Guitar',
  CLASSICAL_GUITAR = 'Classical Guitar',
  BASS = 'Bass',
  ELECTRIC_BASS = 'Electric Bass',
  VIOLIN = 'Violin',
  VIOLA = 'Viola',
  CELLO = 'Cello',
  DOUBLE_BASS = 'Double Bass',

  // Wind Family
  FLUTE = 'Flute',
  PICCOLO = 'Piccolo',
  CLARINET = 'Clarinet',
  BASS_CLARINET = 'Bass Clarinet',
  SAXOPHONE = 'Saxophone',
  ALTO_SAXOPHONE = 'Alto Saxophone',
  TENOR_SAXOPHONE = 'Tenor Saxophone',
  BARITONE_SAXOPHONE = 'Baritone Saxophone',
  TRUMPET = 'Trumpet',
  CORNET = 'Cornet',
  TROMBONE = 'Trombone',
  BASS_TROMBONE = 'Bass Trombone',
  FRENCH_HORN = 'French Horn',
  EUPHONIUM = 'Euphonium',
  TUBA = 'Tuba',

  // Percussion Family
  DRUMS = 'Drums',
  SNARE_DRUM = 'Snare Drum',
  BASS_DRUM = 'Bass Drum',
  TOM_TOM = 'Tom-Tom',
  HI_HAT = 'Hi-Hat',
  CRASH_CYMBAL = 'Crash Cymbal',
  RIDE_CYMBAL = 'Ride Cymbal',
  TIMPANI = 'Timpani',
  XYLOPHONE = 'Xylophone',
  MARIMBA = 'Marimba',
  VIBRAPHONE = 'Vibraphone',
  GLOCKENSPIEL = 'Glockenspiel',
  CONGA_DRUMS = 'Conga Drums',
  BONGO_DRUMS = 'Bongo Drums',
  DJEMBE = 'Djembe',
  CAJON = 'Cajon',
  TAMBOURINE = 'Tambourine',
  TRIANGLE = 'Triangle',

  // Other
  HARP = 'Harp',
  ORGAN = 'Organ',
  PIPE_ORGAN = 'Pipe Organ',
  ELECTRONIC_ORGAN = 'Electronic Organ',
  ACCORDION = 'Accordion',
  HARMONICA = 'Harmonica',
  PIANO_ACCOMPANIMENT = 'Piano Accompaniment',
  OTHER = 'Other',
}

export enum SongDifficulty {
  EASY = 'Easy',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

// Main Rehearsal Interface
export interface Rehearsal {
  id: number;
  title: string;
  date: string | Date;
  type: RehearsalType;
  status: RehearsalStatus;
  location: string;
  duration: number; // in minutes
  performanceId: number;
  rehearsalLeadId: number;
  shiftLeadId: number;
  isTemplate: boolean;
  isPromoted?: boolean; // Indicates if rehearsal has already been promoted
  notes?: string;
  objectives?: string;
  feedback?: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relationships
  performance?: {
    id: number;
    title: string;
    date: string | Date;
    type: string;
    status: string;
  };
  rehearsalLead?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  shiftLead?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  choirMembers?: {
    id: number;
    firstName: string;
    lastName: string;
    voiceCategory?: string;
  }[];
  rehearsalSongs?: RehearsalSong[];
  // NEW: Musicians at rehearsal level
  musicians?: RehearsalMusician[];
}

// NEW: Musician at rehearsal level (not tied to specific songs)
export interface RehearsalMusician {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  instrument: InstrumentType;
  customInstrument?: string; // For "Other" instruments
  isAccompanist: boolean;
  isSoloist: boolean;
  soloStartTime?: number; // seconds from start of rehearsal
  soloEndTime?: number; // seconds from start of rehearsal
  soloNotes?: string;
  accompanimentNotes?: string;
  needsPractice: boolean;
  practiceNotes?: string;
  order: number;
  timeAllocated?: number; // minutes allocated for this musician
  notes?: string;
}

// Rehearsal Song with Musical Key Support
export interface RehearsalSong {
  id: number;
  songId: number;
  song: {
    id: number;
    title: string;
    composer: string;
    genre: string;
  };
  leadSingers: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
  difficulty: SongDifficulty;
  needsWork: boolean;
  order: number;
  timeAllocated: number; // in minutes
  focusPoints?: string;
  notes?: string;
  musicalKey: MusicalKey; // NEW!
  previousLeadSingerId?: number;
  changeReason?: string;

  // Relationships
  voiceParts: RehearsalVoicePart[];
  musicians: RehearsalSongMusician[];
  chorusMembers: {
    id: number;
    firstName: string;
    lastName: string;
    voiceCategory?: string;
  }[];
}

export interface RehearsalVoicePart {
  id: number;
  voicePartType: string; // Soprano, Alto, Tenor, Bass
  memberIds: number[];
  members: {
    id: number;
    firstName: string;
    lastName: string;
    voiceCategory?: string;
  }[];
  needsWork: boolean;
  focusPoints?: string;
  notes?: string;
}

export interface RehearsalSongMusician {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  instrument: InstrumentType;
  isAccompanist: boolean;
  order: number;
  notes?: string;
}

// ============================================================================
// DTOs for API Operations
// ============================================================================

export interface CreateRehearsalDto {
  title: string;
  date: string;
  type: RehearsalType;
  location: string;
  duration: number;
  performanceId: number;
  rehearsalLeadId: number;
  shiftLeadId: number;
  isTemplate?: boolean;
  notes?: string;
  objectives?: string;
  rehearsalSongs?: CreateRehearsalSongDto[];
  // NEW: Musicians at rehearsal level
  musicians?: CreateRehearsalMusicianDto[];
}

export interface CreateRehearsalSongDto {
  songId: number;
  rehearsalSongId?: number; // The ID of the rehearsal song instance (for updates)
  leadSingerIds: number[]; // Changed from leadSingerId to support multiple lead singers
  difficulty: SongDifficulty;
  needsWork?: boolean;
  order: number;
  timeAllocated: number;
  focusPoints?: string;
  notes?: string;
  musicalKey: MusicalKey;
  voiceParts: CreateRehearsalVoicePartDto[];
  musicians: CreateRehearsalMusicianDto[];
  chorusMemberIds?: number[];
}

// DTO specifically for updating rehearsal songs - excludes songId
export interface UpdateRehearsalSongDto {
  // ❌ songId: NOT ALLOWED - Cannot change the actual song

  // ✅ Rehearsal-specific properties that CAN be updated:
  leadSingerIds?: number[];
  chorusMemberIds?: number[];
  musicians?: CreateRehearsalMusicianDto[];
  voiceParts?: CreateRehearsalVoicePartDto[];
  difficulty?: SongDifficulty;
  needsWork?: boolean;
  order?: number;
  timeAllocated?: number;
  focusPoints?: string;
  notes?: string;
  musicalKey?: MusicalKey;
}

export interface CreateRehearsalVoicePartDto {
  voicePartType: string;
  memberIds: number[];
  needsWork?: boolean;
  focusPoints?: string;
  notes?: string;
  order?: number;
  timeAllocated?: number;
}

export interface CreateRehearsalMusicianDto {
  userId?: number | null;
  musicianName?: string | null;
  role?: string;
  instrument: InstrumentType;
  customInstrument?: string;
  isAccompanist?: boolean;
  isSoloist?: boolean;
  soloStartTime?: number | null;
  soloEndTime?: number | null;
  soloNotes?: string | null;
  accompanimentNotes?: string;
  needsPractice?: boolean;
  practiceNotes?: string;
  order: number;
  timeAllocated?: number;
  notes?: string;
}

export interface UpdateRehearsalDto {
  title?: string;
  date?: string;
  type?: RehearsalType;
  status?: RehearsalStatus;
  location?: string;
  duration?: number;
  rehearsalLeadId?: number;
  shiftLeadId?: number;
  notes?: string;
  objectives?: string;
  feedback?: string;
  // NEW: Musicians at rehearsal level
  musicians?: CreateRehearsalMusicianDto[];
}

// ============================================================================
// Filter and Response Types
// ============================================================================

export interface RehearsalFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: RehearsalType;
  status?: RehearsalStatus;
  performanceId?: number;
  startDate?: string;
  endDate?: string;
  rehearsalLeadId?: number;
  shiftLeadId?: number;
}

export interface RehearsalStats {
  totalRehearsals: number;
  planningRehearsals: number;
  inProgressRehearsals: number;
  completedRehearsals: number;
  cancelledRehearsals: number;
  byType: Record<RehearsalType, number>;
  byStatus: Record<RehearsalStatus, number>;
  byMonth: Record<string, number>;
}

export interface RehearsalListResponse {
  data: Rehearsal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// DEDICATED REHEARSAL SONGS ENDPOINT TYPES
// ============================================================================
// These types provide clear separation between song library data and rehearsal-specific details

export interface RehearsalSongLibraryData {
  id: number;
  title: string;
  composer: string;
  genre: string;
  difficulty: SongDifficulty;
  status: SongStatus;
  lyrics: string;
  times_performed: number;
  last_performed: Date;
  created_at: Date;
  updated_at: Date;
  addedById: number;
}

export interface RehearsalSongDetails {
  difficulty: string;
  needsWork: boolean;
  order: number;
  timeAllocated: number;
  focusPoints: string;
  notes: string;
  musicalKey: string;
  leadSingers: User[]; // Changed from leadSinger to leadSingers array
  musicians: RehearsalSongMusician[];
  voiceParts: RehearsalVoicePart[];
  chorusMembers: User[];
}

export interface RehearsalSongWithSeparation {
  rehearsalSongId: number; // The ID of the rehearsal song instance
  songLibrary: RehearsalSongLibraryData;
  rehearsalDetails: RehearsalSongDetails;
}

export interface RehearsalSongsResponse {
  rehearsalInfo: {
    id: number;
    title: string;
    date: Date;
    type: RehearsalType;
    status: RehearsalStatus;
    performanceId: number;
    location?: string;
    duration?: number;
    rehearsalLeadId?: number;
    shiftLeadId?: number;
    notes?: string;
    objectives?: string;
    feedback?: string;
  };
  rehearsalSongs: RehearsalSongWithSeparation[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface MusicalKeyOption {
  value: MusicalKey;
  label: string;
  category: 'Major' | 'Minor';
}

export interface InstrumentOption {
  value: InstrumentType;
  label: string;
  category: string;
}

export interface RehearsalTemplate {
  id: number;
  title: string;
  type: RehearsalType;
  duration: number;
  objectives: string;
  rehearsalSongs: CreateRehearsalSongDto[];
  // New fields for better organization
  category?: string;
  tags?: string[];
  estimatedAttendees?: number;
  difficulty?: 'Easy' | 'Intermediate' | 'Advanced';
  lastUsed?: Date;
  usageCount?: number;
}
