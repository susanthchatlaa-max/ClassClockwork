import {
  Batch,
  Classroom,
  ClashViolation,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_PERIODS,
  Faculty,
  SolverConfig,
  SolverResult,
  Subject,
  TimetableAllocation,
} from './types';
import { auditTimetable } from './validator';

export interface SchedulingUnit {
  id: string;
  subjectId: string;
  batchId: string;
  facultyId: string;
  duration: number; // 1 for theory, 2 or 3 for continuous lab
  isLab: boolean;
  requiredRoomType: 'LECTURE_HALL' | 'LAB';
  requiredEquipment: string[];
  preferredSlot: 'ANY' | 'MORNING' | 'AFTERNOON';
  unitIndex: number; // e.g. 1 of 3 lectures
  totalUnitsForSubject: number;
}

export interface DomainSlot {
  day: DayOfWeek;
  period: number;
  roomId: string;
  score: number; // Higher is better (based on soft constraints)
}

/**
 * Calculates the Gini coefficient of weekly teaching hours among faculty.
 * G = sum_i sum_j |x_i - x_j| / (2 * n * sum_i x_i)
 * Returns a number between 0.0 (perfect equality) and 1.0 (extreme inequality).
 */
export function calculateGiniCoefficient(
  faculty: Faculty[],
  allocations: TimetableAllocation[]
): number {
  if (faculty.length <= 1) return 0;

  const hoursMap = new Map<string, number>();
  for (const f of faculty) {
    hoursMap.set(f.id, 0);
  }

  for (const alloc of allocations) {
    const cur = hoursMap.get(alloc.facultyId) || 0;
    hoursMap.set(alloc.facultyId, cur + (alloc.duration || 1));
  }

  const hours = Array.from(hoursMap.values());
  const n = hours.length;
  const totalHours = hours.reduce((sum, h) => sum + h, 0);

  if (totalHours === 0) return 0;

  let absoluteDifferencesSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      absoluteDifferencesSum += Math.abs(hours[i] - hours[j]);
    }
  }

  const gini = absoluteDifferencesSum / (2 * n * totalHours);
  return Math.round(gini * 1000) / 1000;
}

/**
 * Computes soft constraint satisfaction percentage:
 * Faculty morning/afternoon preference matching.
 */
export function calculatePreferenceSatisfaction(
  faculty: Faculty[],
  allocations: TimetableAllocation[]
): number {
  if (allocations.length === 0) return 100;
  const facultyMap = new Map<string, Faculty>(faculty.map((f) => [f.id, f]));

  let totalPreferencesEvaluated = 0;
  let preferencesSatisfied = 0;

  for (const alloc of allocations) {
    const fac = facultyMap.get(alloc.facultyId);
    if (!fac || fac.preferredSlot === 'ANY') continue;

    totalPreferencesEvaluated++;
    const isMorningPeriod = alloc.period <= 3;
    if (fac.preferredSlot === 'MORNING' && isMorningPeriod) {
      preferencesSatisfied++;
    } else if (fac.preferredSlot === 'AFTERNOON' && !isMorningPeriod) {
      preferencesSatisfied++;
    }
  }

  if (totalPreferencesEvaluated === 0) return 100;
  return Math.round((preferencesSatisfied / totalPreferencesEvaluated) * 100);
}

/**
 * Backtracking Constraint Satisfaction Problem (CSP) Solver
 * Enhanced with:
 * - Minimum Remaining Values (MRV) Heuristic
 * - Degree Heuristic (macro-slots / continuous labs scheduled first)
 * - Forward Checking and Domain Pruning
 * - Soft-constraint preference optimization
 */
export class TimetableCSPSolver {
  private batches: Batch[];
  private faculty: Faculty[];
  private classrooms: Classroom[];
  private subjects: Subject[];
  private config: SolverConfig;

  private batchMap: Map<string, Batch>;
  private facultyMap: Map<string, Faculty>;
  private roomMap: Map<string, Classroom>;
  private subjectMap: Map<string, Subject>;

  private iterations = 0;
  private maxIterations = 50000;
  private startTime = 0;

  constructor(
    batches: Batch[],
    faculty: Faculty[],
    classrooms: Classroom[],
    subjects: Subject[],
    config: Partial<SolverConfig> = {}
  ) {
    this.batches = batches;
    this.faculty = faculty;
    this.classrooms = classrooms;
    this.subjects = subjects;

    this.config = {
      respectLunchBreak: config.respectLunchBreak ?? true,
      lunchPeriod: config.lunchPeriod ?? 4,
      maxConsecutiveHours: config.maxConsecutiveHours ?? 3,
      timeoutMs: config.timeoutMs ?? 5000,
      allowSoftRelaxation: config.allowSoftRelaxation ?? true,
    };

    this.batchMap = new Map(batches.map((b) => [b.id, b]));
    this.facultyMap = new Map(faculty.map((f) => [f.id, f]));
    this.roomMap = new Map(classrooms.map((r) => [r.id, r]));
    this.subjectMap = new Map(subjects.map((s) => [s.id, s]));
  }

  public solve(): SolverResult {
    this.iterations = 0;
    this.startTime = Date.now();

    // 1. Decompose subjects into discrete scheduling units
    const units = this.createSchedulingUnits();

    // 2. Sort units by Degree Heuristic:
    // - Continuous Labs (duration 3, then 2) must be scheduled first into dedicated macro-blocks!
    // - Most constrained faculty (fewest available hours) next
    units.sort((a, b) => {
      if (b.duration !== a.duration) {
        return b.duration - a.duration; // Longer macro-slots first
      }
      if (a.isLab !== b.isLab) {
        return a.isLab ? -1 : 1; // Labs first
      }
      const facA = this.facultyMap.get(a.facultyId);
      const facB = this.facultyMap.get(b.facultyId);
      const unavailA = facA?.unavailableSlots.length || 0;
      const unavailB = facB?.unavailableSlots.length || 0;
      return unavailB - unavailA; // Faculty with more restrictions first
    });

    const currentAllocations: TimetableAllocation[] = [];
    const facultyHours = new Map<string, number>();
    for (const f of this.faculty) {
      facultyHours.set(f.id, 0);
    }

    const unallocatedUnits: SchedulingUnit[] = [];

    // Run Backtracking Search with MRV
    const solved = this.backtrack(0, units, currentAllocations, facultyHours, unallocatedUnits);

    const executionTimeMs = Date.now() - this.startTime;

    // Check for any remaining unallocated subjects
    const unallocatedSubjectsSummary = this.summarizeUnallocated(unallocatedUnits);

    const gini = calculateGiniCoefficient(this.faculty, currentAllocations);
    const prefSat = calculatePreferenceSatisfaction(this.faculty, currentAllocations);
    const clashes = auditTimetable({
      batches: this.batches,
      faculty: this.faculty,
      classrooms: this.classrooms,
      subjects: this.subjects,
      allocations: currentAllocations,
      lunchPeriod: this.config.respectLunchBreak ? this.config.lunchPeriod : 0,
    });

    return {
      success: unallocatedSubjectsSummary.length === 0 && clashes.filter(c => c.severity === 'CRITICAL').length === 0,
      allocations: currentAllocations,
      unallocatedSubjects: unallocatedSubjectsSummary,
      executionTimeMs,
      totalIterations: this.iterations,
      giniCoefficient: gini,
      softPreferenceSatisfactionPercent: prefSat,
      clashes,
    };
  }

  private createSchedulingUnits(): SchedulingUnit[] {
    const units: SchedulingUnit[] = [];

    for (const subject of this.subjects) {
      const fac = this.facultyMap.get(subject.facultyId);
      const isLab = subject.type === 'LAB';
      const duration = subject.duration || 1;
      let remainingPeriods = subject.weeklyHours;
      let unitIndex = 1;

      while (remainingPeriods > 0) {
        const currentDuration = Math.min(duration, remainingPeriods);
        units.push({
          id: `unit-${subject.id}-${unitIndex}`,
          subjectId: subject.id,
          batchId: subject.batchId,
          facultyId: subject.facultyId,
          duration: currentDuration,
          isLab,
          requiredRoomType: subject.requiredRoomType,
          requiredEquipment: subject.requiredEquipment || [],
          preferredSlot: fac?.preferredSlot || 'ANY',
          unitIndex,
          totalUnitsForSubject: Math.ceil(subject.weeklyHours / duration),
        });
        remainingPeriods -= currentDuration;
        unitIndex++;
      }
    }

    return units;
  }

  /**
   * Backtracking recursive solver with Minimum Remaining Values (MRV)
   */
  private backtrack(
    index: number,
    units: SchedulingUnit[],
    allocations: TimetableAllocation[],
    facultyHours: Map<string, number>,
    unallocated: SchedulingUnit[]
  ): boolean {
    this.iterations++;

    // Timeout or iteration cap check
    if (this.iterations > this.maxIterations || Date.now() - this.startTime > this.config.timeoutMs) {
      // Record any unassigned units
      for (let i = index; i < units.length; i++) {
        unallocated.push(units[i]);
      }
      return false;
    }

    if (index >= units.length) {
      return true; // All units assigned successfully!
    }

    // Minimum Remaining Values (MRV):
    // Choose the unassigned unit that has the fewest valid domain values!
    let bestUnitIdx = index;
    let minDomainSize = Infinity;
    let bestDomain: DomainSlot[] = [];

    for (let i = index; i < units.length; i++) {
      const candidateUnit = units[i];
      const validDomain = this.computeValidDomain(candidateUnit, allocations, facultyHours);

      if (validDomain.length === 0) {
        // Immediate dead-end detected for this branch
        if (!this.config.allowSoftRelaxation) {
          return false;
        }
      }

      if (validDomain.length < minDomainSize) {
        minDomainSize = validDomain.length;
        bestUnitIdx = i;
        bestDomain = validDomain;
        // If domain is 0 or 1, break early (most constrained)
        if (minDomainSize <= 1) break;
      }
    }

    // Swap best MRV unit to current index
    const currentUnit = units[bestUnitIdx];
    units[bestUnitIdx] = units[index];
    units[index] = currentUnit;

    // If no valid domain exists for currentUnit even with relaxation:
    if (bestDomain.length === 0) {
      if (this.config.allowSoftRelaxation) {
        // Push to unallocated and continue with remaining units
        unallocated.push(currentUnit);
        return this.backtrack(index + 1, units, allocations, facultyHours, unallocated);
      }
      return false;
    }

    // Sort domain values by heuristic score (Least Constraining Value / Soft Preference Weighting)
    bestDomain.sort((a, b) => b.score - a.score);

    for (const slot of bestDomain) {
      const allocationId = `alloc-${currentUnit.id}-${slot.day}-p${slot.period}`;
      const newAlloc: TimetableAllocation = {
        id: allocationId,
        subjectId: currentUnit.subjectId,
        batchId: currentUnit.batchId,
        facultyId: currentUnit.facultyId,
        roomId: slot.roomId,
        day: slot.day,
        period: slot.period,
        duration: currentUnit.duration,
        isLabBlock: currentUnit.isLab,
      };

      // Place assignment
      allocations.push(newAlloc);
      facultyHours.set(
        currentUnit.facultyId,
        (facultyHours.get(currentUnit.facultyId) || 0) + currentUnit.duration
      );

      // Recurse
      const success = this.backtrack(index + 1, units, allocations, facultyHours, unallocated);
      if (success) {
        return true;
      }

      // Backtrack (undo assignment)
      allocations.pop();
      facultyHours.set(
        currentUnit.facultyId,
        (facultyHours.get(currentUnit.facultyId) || 0) - currentUnit.duration
      );
    }

    // If all domain values failed
    if (this.config.allowSoftRelaxation) {
      unallocated.push(currentUnit);
      return this.backtrack(index + 1, units, allocations, facultyHours, unallocated);
    }

    return false;
  }

  /**
   * Computes valid domain slots (day, period, room) for a scheduling unit
   */
  private computeValidDomain(
    unit: SchedulingUnit,
    allocations: TimetableAllocation[],
    facultyHours: Map<string, number>
  ): DomainSlot[] {
    const validSlots: DomainSlot[] = [];
    const faculty = this.facultyMap.get(unit.facultyId);
    const batch = this.batchMap.get(unit.batchId);
    const subject = this.subjectMap.get(unit.subjectId);

    if (!faculty || !batch || !subject) return [];

    // Check faculty weekly hours limit
    const currentFacHours = facultyHours.get(unit.facultyId) || 0;
    if (currentFacHours + unit.duration > faculty.maxWeeklyHours) {
      return []; // Faculty workload exceeded
    }

    // Filter candidate rooms:
    // Capacity >= batch size
    // Type matches unit requiredRoomType
    // Must satisfy requiredEquipment
    const candidateRooms = this.classrooms.filter((room) => {
      if (room.capacity < batch.size) return false;
      if (unit.isLab && room.type !== 'LAB') return false;
      if (!unit.isLab && room.type === 'LAB') return false; // Prefer lecture halls for theory
      if (unit.requiredEquipment && unit.requiredEquipment.length > 0) {
        const hasAll = unit.requiredEquipment.every((eq) => room.equipment.includes(eq));
        if (!hasAll) return false;
      }
      return true;
    });

    if (candidateRooms.length === 0) {
      return [];
    }

    const lunchPeriod = this.config.respectLunchBreak ? this.config.lunchPeriod : -1;
    const maxPeriod = 7; // Total periods 1..7

    for (const day of DAYS_OF_WEEK) {
      // Check how many times this subject is already scheduled on this day (distribute evenly)
      const subjectAlreadyOnDay = allocations.some(
        (a) => a.subjectId === unit.subjectId && a.day === day
      );

      for (let startPeriod = 1; startPeriod <= maxPeriod - unit.duration + 1; startPeriod++) {
        const endPeriod = startPeriod + unit.duration - 1;

        // Constraint: Cannot overlap Lunch Break
        if (lunchPeriod > 0) {
          if (startPeriod <= lunchPeriod && endPeriod >= lunchPeriod) {
            continue; // Overlaps lunch!
          }
        }

        // Constraint: Continuous multi-period lab session cannot bridge lunch
        // Morning lab: periods 1-3. Afternoon lab: periods 5-7.
        if (unit.duration > 1 && lunchPeriod > 0) {
          if (startPeriod < lunchPeriod && endPeriod > lunchPeriod) {
            continue;
          }
        }

        // Constraint: Faculty unavailable slots
        let facultyUnavailable = false;
        for (let p = startPeriod; p <= endPeriod; p++) {
          if (faculty.unavailableSlots.some((u) => u.day === day && u.period === p)) {
            facultyUnavailable = true;
            break;
          }
        }
        if (facultyUnavailable) continue;

        // Constraint: Faculty already booked in another batch/room at this time
        let facultyBusy = false;
        for (let p = startPeriod; p <= endPeriod; p++) {
          if (this.isFacultyOccupied(allocations, unit.facultyId, day, p)) {
            facultyBusy = true;
            break;
          }
        }
        if (facultyBusy) continue;

        // Constraint: Batch already booked in another class at this time
        let batchBusy = false;
        for (let p = startPeriod; p <= endPeriod; p++) {
          if (this.isBatchOccupied(allocations, unit.batchId, day, p)) {
            batchBusy = true;
            break;
          }
        }
        if (batchBusy) continue;

        // Find available candidate room
        for (const room of candidateRooms) {
          let roomBusy = false;
          for (let p = startPeriod; p <= endPeriod; p++) {
            if (this.isRoomOccupied(allocations, room.id, day, p)) {
              roomBusy = true;
              break;
            }
          }
          if (roomBusy) continue;

          // Calculate soft preference heuristic score
          let score = 100;

          // Preference 1: Morning/Afternoon preference
          const isMorning = startPeriod <= 3;
          if (unit.preferredSlot === 'MORNING') {
            score += isMorning ? 40 : -20;
          } else if (unit.preferredSlot === 'AFTERNOON') {
            score += !isMorning ? 40 : -20;
          }

          // Preference 2: Spread subject over different days
          if (subjectAlreadyOnDay) {
            score -= 30;
          }

          // Preference 3: Lab scheduling preference (dedicated afternoon blocks for multi-hour labs)
          if (unit.isLab && !isMorning) {
            score += 25; // Afternoon lab blocks are standard and convenient
          }

          validSlots.push({
            day,
            period: startPeriod,
            roomId: room.id,
            score,
          });
        }
      }
    }

    return validSlots;
  }

  private isFacultyOccupied(
    allocations: TimetableAllocation[],
    facultyId: string,
    day: DayOfWeek,
    period: number
  ): boolean {
    return allocations.some((a) => {
      if (a.facultyId !== facultyId || a.day !== day) return false;
      const end = a.period + (a.duration || 1) - 1;
      return period >= a.period && period <= end;
    });
  }

  private isBatchOccupied(
    allocations: TimetableAllocation[],
    batchId: string,
    day: DayOfWeek,
    period: number
  ): boolean {
    return allocations.some((a) => {
      if (a.batchId !== batchId || a.day !== day) return false;
      const end = a.period + (a.duration || 1) - 1;
      return period >= a.period && period <= end;
    });
  }

  private isRoomOccupied(
    allocations: TimetableAllocation[],
    roomId: string,
    day: DayOfWeek,
    period: number
  ): boolean {
    return allocations.some((a) => {
      if (a.roomId !== roomId || a.day !== day) return false;
      const end = a.period + (a.duration || 1) - 1;
      return period >= a.period && period <= end;
    });
  }

  private summarizeUnallocated(
    units: SchedulingUnit[]
  ): { subject: Subject; remainingHours: number; reason: string }[] {
    const summaryMap = new Map<string, { subject: Subject; hours: number; reason: string }>();

    for (const unit of units) {
      const sub = this.subjectMap.get(unit.subjectId);
      if (!sub) continue;

      const existing = summaryMap.get(sub.id);
      const fac = this.facultyMap.get(sub.facultyId);
      const batch = this.batchMap.get(sub.batchId);

      let reason = 'Heavily constrained timetable slot capacity';
      if (sub.type === 'LAB') {
        reason = `Continuous ${unit.duration}-hour lab could not find unconflicted lab room & faculty slot`;
      } else if (fac && fac.unavailableSlots.length >= 3) {
        reason = `Faculty ${fac.name} availability window is restricted`;
      } else if (batch) {
        reason = `Batch ${batch.name} schedule is fully saturated during available periods`;
      }

      if (existing) {
        existing.hours += unit.duration;
      } else {
        summaryMap.set(sub.id, {
          subject: sub,
          hours: unit.duration,
          reason,
        });
      }
    }

    return Array.from(summaryMap.values()).map((v) => ({
      subject: v.subject,
      remainingHours: v.hours,
      reason: v.reason,
    }));
  }
}
