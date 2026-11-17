import {
  Batch,
  Classroom,
  ClashViolation,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_PERIODS,
  Faculty,
  Subject,
  TimetableAllocation,
} from './types';

export interface AuditContext {
  batches: Batch[];
  faculty: Faculty[];
  classrooms: Classroom[];
  subjects: Subject[];
  allocations: TimetableAllocation[];
  lunchPeriod?: number;
}

export function auditTimetable(context: AuditContext): ClashViolation[] {
  const { batches, faculty, classrooms, subjects, allocations, lunchPeriod = 4 } = context;
  const violations: ClashViolation[] = [];

  const batchMap = new Map<string, Batch>(batches.map((b) => [b.id, b]));
  const facultyMap = new Map<string, Faculty>(faculty.map((f) => [f.id, f]));
  const roomMap = new Map<string, Classroom>(classrooms.map((r) => [r.id, r]));
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  // Helper to expand an allocation into its occupied (day, period) slots
  interface ExpandedSlot {
    allocation: TimetableAllocation;
    day: DayOfWeek;
    period: number;
    subject: Subject | undefined;
    faculty: Faculty | undefined;
    room: Classroom | undefined;
    batch: Batch | undefined;
  }

  const occupiedSlots: ExpandedSlot[] = [];

  for (const alloc of allocations) {
    const sub = subjectMap.get(alloc.subjectId);
    const fac = facultyMap.get(alloc.facultyId);
    const room = roomMap.get(alloc.roomId);
    const batch = batchMap.get(alloc.batchId);

    const dur = alloc.duration || 1;
    for (let offset = 0; offset < dur; offset++) {
      const p = alloc.period + offset;
      occupiedSlots.push({
        allocation: alloc,
        day: alloc.day,
        period: p,
        subject: sub,
        faculty: fac,
        room: room,
        batch: batch,
      });
    }

    // 1. Check Capacity Exceeded
    if (room && batch && room.capacity < batch.size) {
      violations.push({
        id: `v-cap-${alloc.id}`,
        type: 'CAPACITY_EXCEEDED',
        severity: 'CRITICAL',
        message: `Capacity Clash: ${room.name} (Cap: ${room.capacity}) is too small for ${batch.name} (${batch.size} students)`,
        day: alloc.day,
        period: alloc.period,
        duration: alloc.duration,
        allocationIds: [alloc.id],
        roomId: room.id,
        batchId: batch.id,
        details: { required: batch.size, actual: room.capacity },
      });
    }

    // 2. Check Lab Equipment & Room Type Mismatch
    if (sub && sub.type === 'LAB') {
      if (room && room.type !== 'LAB') {
        violations.push({
          id: `v-labtype-${alloc.id}`,
          type: 'LAB_EQUIPMENT_MISMATCH',
          severity: 'CRITICAL',
          message: `Lab Clash: ${sub.name} requires a Laboratory, but ${room.name} is a standard Lecture Hall`,
          day: alloc.day,
          period: alloc.period,
          duration: alloc.duration,
          allocationIds: [alloc.id],
          subjectId: sub.id,
          roomId: room.id,
        });
      } else if (room && sub.requiredEquipment && sub.requiredEquipment.length > 0) {
        const missingEquipment = sub.requiredEquipment.filter(
          (eq) => !room.equipment.includes(eq)
        );
        if (missingEquipment.length > 0) {
          violations.push({
            id: `v-equip-${alloc.id}`,
            type: 'LAB_EQUIPMENT_MISMATCH',
            severity: 'CRITICAL',
            message: `Equipment Clash: ${room.name} lacks required equipment: ${missingEquipment.join(', ')} for ${sub.name}`,
            day: alloc.day,
            period: alloc.period,
            duration: alloc.duration,
            allocationIds: [alloc.id],
            subjectId: sub.id,
            roomId: room.id,
          });
        }
      }
    }

    // 3. Check Faculty Availability Slot Violations
    if (fac) {
      for (let offset = 0; offset < dur; offset++) {
        const currentPeriod = alloc.period + offset;
        const isUnavailable = fac.unavailableSlots.some(
          (u) => u.day === alloc.day && u.period === currentPeriod
        );
        if (isUnavailable) {
          violations.push({
            id: `v-unavail-${alloc.id}-p${currentPeriod}`,
            type: 'FACULTY_UNAVAILABLE',
            severity: 'CRITICAL',
            message: `Availability Clash: ${fac.name} is marked UNAVAILABLE on ${alloc.day} Period ${currentPeriod}`,
            day: alloc.day,
            period: currentPeriod,
            allocationIds: [alloc.id],
            facultyId: fac.id,
          });
        }
      }
    }

    // 4. Check Lunch Break Violation
    if (lunchPeriod > 0) {
      for (let offset = 0; offset < dur; offset++) {
        const currentPeriod = alloc.period + offset;
        if (currentPeriod === lunchPeriod) {
          violations.push({
            id: `v-lunch-${alloc.id}`,
            type: 'LUNCH_OCCUPIED',
            severity: 'WARNING',
            message: `Lunch Clash: Scheduled during protected Departmental Lunch Break (Period ${lunchPeriod})`,
            day: alloc.day,
            period: currentPeriod,
            allocationIds: [alloc.id],
          });
        }
      }
    }
  }

  // 5. Check Pairwise Clashes (Double Bookings)
  for (let i = 0; i < occupiedSlots.length; i++) {
    for (let j = i + 1; j < occupiedSlots.length; j++) {
      const s1 = occupiedSlots[i];
      const s2 = occupiedSlots[j];

      // Must be same day and same period
      if (s1.day !== s2.day || s1.period !== s2.period) continue;
      // Skip if they belong to the exact same allocation record
      if (s1.allocation.id === s2.allocation.id) continue;

      // A. Faculty Double-Booking
      if (s1.allocation.facultyId === s2.allocation.facultyId) {
        const facName = s1.faculty?.name || 'Faculty';
        const r1Name = s1.room?.name || 'Room A';
        const r2Name = s2.room?.name || 'Room B';
        const b1Name = s1.batch?.name || 'Batch 1';
        const b2Name = s2.batch?.name || 'Batch 2';

        const violationId = `v-fac-clash-${s1.allocation.id}-${s2.allocation.id}-p${s1.period}`;
        if (!violations.some((v) => v.id === violationId)) {
          violations.push({
            id: violationId,
            type: 'FACULTY_DOUBLE_BOOKED',
            severity: 'CRITICAL',
            message: `Clash: ${facName} already booked in ${r1Name} (${b1Name}) and ${r2Name} (${b2Name})`,
            day: s1.day,
            period: s1.period,
            allocationIds: [s1.allocation.id, s2.allocation.id],
            facultyId: s1.allocation.facultyId,
            details: {
              facultyName: facName,
              firstRoom: r1Name,
              secondRoom: r2Name,
              firstBatch: b1Name,
              secondBatch: b2Name,
            },
          });
        }
      }

      // B. Room Double-Booking
      if (s1.allocation.roomId === s2.allocation.roomId) {
        const roomName = s1.room?.name || 'Room';
        const sub1Name = s1.subject?.name || 'Class 1';
        const sub2Name = s2.subject?.name || 'Class 2';

        const violationId = `v-room-clash-${s1.allocation.id}-${s2.allocation.id}-p${s1.period}`;
        if (!violations.some((v) => v.id === violationId)) {
          violations.push({
            id: violationId,
            type: 'ROOM_DOUBLE_BOOKED',
            severity: 'CRITICAL',
            message: `Clash: ${roomName} double-booked with "${sub1Name}" and "${sub2Name}"`,
            day: s1.day,
            period: s1.period,
            allocationIds: [s1.allocation.id, s2.allocation.id],
            roomId: s1.allocation.roomId,
          });
        }
      }

      // C. Batch Double-Booking
      if (s1.allocation.batchId === s2.allocation.batchId) {
        const batchName = s1.batch?.name || 'Batch';
        const sub1Name = s1.subject?.name || 'Subject A';
        const sub2Name = s2.subject?.name || 'Subject B';

        const violationId = `v-batch-clash-${s1.allocation.id}-${s2.allocation.id}-p${s1.period}`;
        if (!violations.some((v) => v.id === violationId)) {
          violations.push({
            id: violationId,
            type: 'BATCH_DOUBLE_BOOKED',
            severity: 'CRITICAL',
            message: `Clash: ${batchName} has overlapping classes: "${sub1Name}" and "${sub2Name}"`,
            day: s1.day,
            period: s1.period,
            allocationIds: [s1.allocation.id, s2.allocation.id],
            batchId: s1.allocation.batchId,
          });
        }
      }
    }
  }

  // 6. Check Faculty Workload Limits
  const facultyHours = new Map<string, number>();
  for (const alloc of allocations) {
    const dur = alloc.duration || 1;
    const current = facultyHours.get(alloc.facultyId) || 0;
    facultyHours.set(alloc.facultyId, current + dur);
  }

  for (const [fId, totalHrs] of facultyHours.entries()) {
    const fac = facultyMap.get(fId);
    if (fac && totalHrs > fac.maxWeeklyHours) {
      violations.push({
        id: `v-overload-${fId}`,
        type: 'FACULTY_OVERLOAD',
        severity: 'WARNING',
        message: `Workload Exceeded: ${fac.name} assigned ${totalHrs} hrs/week (Limit: ${fac.maxWeeklyHours} hrs)`,
        day: 'Monday',
        period: 1,
        allocationIds: allocations.filter((a) => a.facultyId === fId).map((a) => a.id),
        facultyId: fId,
        details: { actual: totalHrs, limit: fac.maxWeeklyHours },
      });
    }
  }

  return violations;
}
