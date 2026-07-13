// ============================================
// Shared TypeScript types for the MedRep app
// ============================================

export type Speciality =
  | 'GENERAL_PHYSICIAN'
  | 'CONSULTING_PHYSICIAN'
  | 'DIABETOLOGIST'
  | 'CARDIOLOGIST'
  | 'NEUROLOGIST'
  | 'ORTHOPEDIC'
  | 'PEDIATRICIAN'
  | 'GYNECOLOGIST'
  | 'ENT'
  | 'ENDOCRINOLOGIST'
  | 'GASTROENTEROLOGIST';

export type Grade = 'A' | 'B' | 'C';
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';
export type DoctorStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type PlanType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PlanItemStatus = 'PENDING' | 'VISITED' | 'SKIPPED' | 'RESCHEDULED';

export const SPECIALITY_LABELS: Record<Speciality, string> = {
  GENERAL_PHYSICIAN: 'GP',
  CONSULTING_PHYSICIAN: 'Consultant',
  DIABETOLOGIST: 'Diabetologist',
  CARDIOLOGIST: 'Cardiologist',
  NEUROLOGIST: 'Neurologist',
  ORTHOPEDIC: 'Orthopedic',
  PEDIATRICIAN: 'Pediatrician',
  GYNECOLOGIST: 'Gynecologist',
  ENT: 'ENT',
  ENDOCRINOLOGIST: 'Endocrinologist',
  GASTROENTEROLOGIST: 'Gastro',
};

export const SPECIALITY_COLORS: Record<Speciality, string> = {
  GENERAL_PHYSICIAN: '#3b82f6',
  CONSULTING_PHYSICIAN: '#6366f1',
  DIABETOLOGIST: '#f59e0b',
  CARDIOLOGIST: '#ef4444',
  NEUROLOGIST: '#8b5cf6',
  ORTHOPEDIC: '#60a5fa',
  PEDIATRICIAN: '#ec4899',
  GYNECOLOGIST: '#f43f5e',
  ENT: '#34d399',
  ENDOCRINOLOGIST: '#84cc16',
  GASTROENTEROLOGIST: '#f97316',
};

export const GRADE_COLORS: Record<Grade, string> = {
  A: '#ef4444',
  B: '#f59e0b',
  C: '#22c55e',
};

// Visit frequency per grade (default mapping)
export const GRADE_VISIT_FREQUENCY: Record<Grade, number> = {
  A: 3,
  B: 2,
  C: 1,
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  color?: string;
  beats?: Beat[];
  _count?: { doctors: number; beats: number; chemists: number };
  createdAt: string;
}

export interface Beat {
  id: string;
  name: string;
  areaId: string;
  area?: { id: string; name: string; color?: string };
  description?: string;
  dayOfWeek?: number;
  _count?: { doctors: number; chemists: number };
}

export interface Doctor {
  id: string;
  name: string;
  speciality: Speciality;
  grade: Grade;
  hospital?: string;
  clinic?: string;
  areaId?: string;
  area?: { id: string; name: string; color?: string };
  beatId?: string;
  beat?: { id: string; name: string };
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  morningStart?: string;
  morningEnd?: string;
  afternoonStart?: string;
  afternoonEnd?: string;
  eveningStart?: string;
  eveningEnd?: string;
  preferredDays: number[];
  preferredTime?: TimeSlot;
  exStationDays: number[];
  assistantName?: string;
  phone?: string;
  notes?: string;
  status: DoctorStatus;
  favorite: boolean;
  priority: number;
  visitFrequency: number; // Visits per month: 1, 2, or 3
  kyc: boolean; // KYC verified doctor
  chemistId?: string;
  chemist?: { id: string; name: string; pharmacyName?: string };
  visits?: Visit[];
  _count?: { visits: number; planItems?: number };
  // Computed fields from API
  monthlyVisitsDone?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chemist {
  id: string;
  name: string;
  pharmacyName?: string;
  areaId?: string;
  area?: { id: string; name: string };
  beatId?: string;
  beat?: { id: string; name: string };
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  _count?: { doctors: number };
  createdAt: string;
}

export interface Visit {
  id: string;
  doctorId: string;
  doctor?: Partial<Doctor>;
  visitDate: string;
  remarks?: string;
  products: string[];
  duration?: number;
  followUpDate?: string;
  skipped: boolean;
  skipReason?: string;
  completed: boolean;
  planItemId?: string;
  // MedRep-specific
  brandsPromoted: string[];
  brandsWritten: string[];
  doctorFeedback?: string;
  followUpBrand?: string;
  rxCommitment?: number;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  category?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  date: string;
  type: PlanType;
  status: PlanStatus;
  notes?: string;
  items: PlanItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface PlanItem {
  id: string;
  planId: string;
  doctorId: string;
  doctor: Doctor;
  order: number;
  scheduledTime?: string;
  timeSlot?: TimeSlot;
  status: PlanItemStatus;
  visit?: Visit;
}

export interface DashboardData {
  plan: Plan | null;
  planProgress: {
    total: number;
    completed: number;
    skipped: number;
    pending: number;
    percentage: number;
  };
  stats: {
    todaysVisits: number;
    totalDoctors: number;
    activeDoctors: number;
    totalChemists: number;
    preferredToday: number;
    exStationToday: number;
  };
  pendingFollowups: Array<Visit & { doctor: Partial<Doctor> }>;
  recentVisits: Array<{ visitDate: string; _count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  legs: Array<{
    distance: number;
    duration: number;
    summary?: string;
  }>;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  type?: string;
}
