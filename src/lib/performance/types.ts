// ============================================================================
// PERFORMANCE MODULE - Simplified Container Structure
// ============================================================================

// ============================================================================
// Supporting Types
// ============================================================================

// ✅ FIXED: Import User from the main user types instead of duplicating
import type { User } from '@/lib/user/type';

export enum PerformanceType {
  CONCERT = 'Concert',
  WORSHIP_SERVICE = 'Service de Culte',
  SUNDAY_SERVICE = 'Service du Dimanche',
  SPECIAL_EVENT = 'Événement Spécial',
  REHEARSAL = 'Répétition',
  WEDDING = 'Mariage',
  FUNERAL = 'Funérailles',
  OTHER = 'Autre',
}

export enum PerformanceStatus {
  UPCOMING = 'upcoming',
  IN_PREPARATION = 'in_preparation',
  READY = 'ready',
  COMPLETED = 'completed',
}

// Enhanced Performance interface matching backend structure
export interface Performance {
  id: number;
  date: string | Date;
  type: PerformanceType;
  shiftLeadId?: number; // Now optional - can be assigned later
  location?: string;
  expectedAudience?: number;
  notes?: string;
  status: PerformanceStatus;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relationships (populated by backend)
  shiftLead?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  // Detailed data only available when status is "ready" or "completed"
  performanceSongs?: PerformanceSong[];
  choirMembers?: User[];
}

// Enhanced Performance Song interface matching backend structure
export interface PerformanceSong {
  id: number;
  performanceId: number;
  songId: number;
  song: {
    id: number;
    title: string;
    composer: string;
    genre: string;
  };
  leadSingerId?: number;
  leadSinger?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  order: number;
  notes?: string;
  timeAllocated?: number; // Duration in minutes
  focusPoints?: string;
  musicalKey?: string; // Musical key from rehearsal
  // Voice parts and musicians from rehearsal
  voiceParts: PerformanceVoicePart[];
  musicians: PerformanceMusician[];
}

export interface PerformanceVoicePart {
  id: number;
  performanceSongId: number;
  type: string; // Soprano, Alto, Tenor, Bass
  needsWork: boolean;
  focusPoints?: string;
  notes?: string;
  order: number;
  timeAllocated?: number; // Duration per voice part
  memberIds: number[];
  members: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
}

export interface PerformanceMusician {
  id: number;
  performanceSongId: number;
  userId?: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  musicianName?: string; // For external musicians
  instrument: string;
  role?: string;
  isSoloist: boolean;
  isAccompanist: boolean;
  soloStartTime?: number;
  soloEndTime?: number;
  soloNotes?: string;
  accompanimentNotes?: string;
  needsPractice: boolean;
  order: number;
  timeAllocated?: number; // Duration per musician
  notes?: string;
}

// ============================================================================
// DTOs for API Operations
// ============================================================================

export interface CreatePerformanceDto {
  date: string;
  type: PerformanceType;
  shiftLeadId?: number;
  location?: string;
  expectedAudience?: number;
  notes?: string;
  status?: PerformanceStatus;
}

export interface UpdatePerformanceDto {
  date?: string;
  type?: PerformanceType;
  shiftLeadId?: number;
  location?: string;
  expectedAudience?: number;
  notes?: string;
  status?: PerformanceStatus;
}

// ============================================================================
// Filter and Response Types
// ============================================================================

export interface PerformanceFilterDto {
  page?: number;
  limit?: number;
  search?: string;
  type?: PerformanceType;
  status?: PerformanceStatus;
  startDate?: string;
  endDate?: string;
  date?: string;
  shiftLeadId?: number;
}

export interface PerformanceStats {
  totalPerformances: number;
  completedPerformances: number;
  upcomingPerformances: number;
  inPreparationPerformances: number;
  readyPerformances: number;
  byType: Record<PerformanceType, number>;
  byStatus: Record<PerformanceStatus, number>;
  byMonth: Record<string, number>;
}

export interface PerformanceListResponse {
  data: Performance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================================
// Bulk Rehearsal Promotion Types
// ============================================================================

export interface PromotableRehearsal {
  id: number;
  title: string;
  performanceId: number;
  performanceTitle: string;
  rehearsalDate: Date;
  status: string;
  location?: string;
  duration?: number;
  isPromoted?: boolean; // Indicates if rehearsal has already been promoted
}

export interface PromotionResult {
  success: number;
  errors: Array<{
    rehearsalId: number;
    error: string;
  }>;
  promotedRehearsals?: number[];
}

export interface BulkPromotionRequest {
  rehearsalIds: number[];
}

export interface PromotionOptions {
  mode: 'add' | 'replace';
}

// ============================================================================
// New Performance Workflow Types
// ============================================================================

export interface UnassignedPerformance extends Performance {
  // Additional fields for unassigned performances
  daysUntilPerformance: number;
  urgencyLevel: 'low' | 'medium' | 'high';
}

export interface BulkCreatePerformanceDto {
  performances: CreatePerformanceDto[];
}

export interface BulkAssignmentDto {
  performanceIds: number[];
  shiftLeadId: number;
}

export interface YearlyPlanningData {
  year: number;
  performances: CreatePerformanceDto[];
  totalCount: number;
}

export interface AssignmentStats {
  totalUnassigned: number;
  urgentCount: number; // Performances within 7 days
  overdueCount: number; // Performances that should have been assigned
  byType: Record<PerformanceType, number>;
}
