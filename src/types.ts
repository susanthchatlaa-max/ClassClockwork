export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface PeriodSlot {
  period: number;
  label: string;
  startTime: string;
  endTime: string;
  isLunchBreak?: boolean;
}

export const DEFAULT_PERIODS: PeriodSlot[] = [
  { period: 1, label: 'Period 1', startTime: '09:00', endTime: '10:00' },
  { period: 2, label: 'Period 2', startTime: '10:00', endTime: '11:00' },
  { period: 3, label: 'Period 3', startTime: '11:00', endTime: '12:00' },
  { period: 4, label: 'Lunch Break', startTime: '12:00', endTime: '01:00', isLunchBreak: true },
  { period: 5, label: 'Period 4 (Afternoon 1)', startTime: '01:00', endTime: '02:00' },
  { period: 6, label: 'Period 5 (Afternoon 2)', startTime: '02:00', endTime: '03:00' },
  { period: 7, label: 'Period 6 (Afternoon 3)', startTime: '03:00', endTime: '04:00' },
];

export interface Batch {
  id: string;
  name: string;
  code: string;
  size: number;
  department: string;
}

export interface UnavailableSlot {
  day: DayOfWeek;
  period: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  maxWeeklyHours: number;
  preferredSlot: 'ANY' | 'MORNING' | 'AFTERNOON';
  unavailableSlots: UnavailableSlot[];
  color?: string;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  capacity: number;
  type: 'LECTURE_HALL' | 'LAB';
  equipment: string[];
  building?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  batchId: string;
  facultyId: string;
  type: 'THEORY' | 'LAB';
  duration: number; // 1 for theory, 2 or 3 for lab continuous block
  weeklyHours: number; // Total periods per week needed
  credits: number;
  requiredRoomType: 'LECTURE_HALL' | 'LAB';
  requiredEquipment: string[];
  color: string;
}

export interface TimetableAllocation {
  id: string;
  subjectId: string;
  batchId: string;
  facultyId: string;
  roomId: string;
  day: DayOfWeek;
  period: number; // Start period
  duration: number; // 1 or more periods
  isLabBlock?: boolean;
  isLocked?: boolean;
}

export type ClashType =
  | 'FACULTY_DOUBLE_BOOKED'
  | 'ROOM_DOUBLE_BOOKED'
  | 'BATCH_DOUBLE_BOOKED'
  | 'CAPACITY_EXCEEDED'
  | 'LAB_EQUIPMENT_MISMATCH'
  | 'FACULTY_UNAVAILABLE'
  | 'FACULTY_OVERLOAD'
  | 'LUNCH_OCCUPIED'
  | 'CONSECUTIVE_OVERLOAD';

export interface ClashViolation {
  id: string;
  type: ClashType;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  day: DayOfWeek;
  period: number;
  duration?: number;
  allocationIds: string[];
  facultyId?: string;
  roomId?: string;
  batchId?: string;
  subjectId?: string;
  details?: Record<string, any>;
}

export interface TimetableDataset {
  batches: Batch[];
  faculty: Faculty[];
  classrooms: Classroom[];
  subjects: Subject[];
  allocations: TimetableAllocation[];
}

export interface SolverConfig {
  respectLunchBreak: boolean;
  lunchPeriod: number;
  maxConsecutiveHours: number;
  timeoutMs: number;
  allowSoftRelaxation: boolean;
}

export interface SolverResult {
  success: boolean;
  allocations: TimetableAllocation[];
  unallocatedSubjects: { subject: Subject; remainingHours: number; reason: string }[];
  executionTimeMs: number;
  totalIterations: number;
  giniCoefficient: number;
  softPreferenceSatisfactionPercent: number;
  clashes: ClashViolation[];
}
