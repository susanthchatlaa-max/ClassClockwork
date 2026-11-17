import {
  Batch,
  Classroom,
  DEFAULT_PERIODS,
  Faculty,
  Subject,
  TimetableAllocation,
} from './types';

// Convert DayOfWeek to an offset from next Monday
const DAY_OFFSETS: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
};

/**
 * Generates an iCalendar (.ics) string for importing into
 * Google Calendar, Apple Calendar, or Microsoft Outlook.
 */
export function generateICS(params: {
  allocations: TimetableAllocation[];
  subjects: Subject[];
  faculty: Faculty[];
  classrooms: Classroom[];
  batches: Batch[];
  filterBatchId?: string;
  filterFacultyId?: string;
  calendarName?: string;
}): string {
  const {
    allocations,
    subjects,
    faculty,
    classrooms,
    batches,
    filterBatchId,
    filterFacultyId,
    calendarName = 'ClassClockwork College Timetable',
  } = params;

  const subMap = new Map(subjects.map((s) => [s.id, s]));
  const facMap = new Map(faculty.map((f) => [f.id, f]));
  const roomMap = new Map(classrooms.map((r) => [r.id, r]));
  const batchMap = new Map(batches.map((b) => [b.id, b]));

  let filteredAllocations = allocations;
  if (filterBatchId) {
    filteredAllocations = filteredAllocations.filter((a) => a.batchId === filterBatchId);
  }
  if (filterFacultyId) {
    filteredAllocations = filteredAllocations.filter((a) => a.facultyId === filterFacultyId);
  }

  // Base date: Next Monday from today
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (1 - dayOfWeek + 7) % 7 || 7;
  const baseMonday = new Date(today);
  baseMonday.setDate(today.getDate() + distanceToMonday);
  baseMonday.setHours(0, 0, 0, 0);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClassClockwork//ZeroClash Sprint Timetable Generator//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const alloc of filteredAllocations) {
    const sub = subMap.get(alloc.subjectId);
    const fac = facMap.get(alloc.facultyId);
    const room = roomMap.get(alloc.roomId);
    const batch = batchMap.get(alloc.batchId);

    const periodSlot = DEFAULT_PERIODS.find((p) => p.period === alloc.period);
    const endPeriodSlot = DEFAULT_PERIODS.find(
      (p) => p.period === alloc.period + (alloc.duration || 1) - 1
    ) || periodSlot;

    if (!periodSlot || !endPeriodSlot) continue;

    const dayOffset = DAY_OFFSETS[alloc.day] ?? 0;
    const eventDate = new Date(baseMonday);
    eventDate.setDate(baseMonday.getDate() + dayOffset);

    const [startH, startM] = periodSlot.startTime.split(':').map(Number);
    const [endH, endM] = endPeriodSlot.endTime.split(':').map(Number);

    const dtStart = new Date(eventDate);
    dtStart.setHours(startH, startM, 0, 0);

    const dtEnd = new Date(eventDate);
    dtEnd.setHours(endH, endM, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatICSDate = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const summary = `${sub?.name || 'Class'} (${sub?.code || ''}) - ${batch?.code || ''}`;
    const location = `${room?.name || 'Classroom'} (${room?.building || 'Main Campus'})`;
    const description = `Faculty: ${fac?.name || 'Instructor'} (${fac?.email || ''})\\nBatch: ${batch?.name || ''}\\nType: ${sub?.type || 'Lecture'}\\nDuration: ${alloc.duration || 1} period(s)`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:classclockwork-${alloc.id}@college.edu`,
      `DTSTAMP:${formatICSDate(new Date())}Z`,
      `DTSTART:${formatICSDate(dtStart)}`,
      `DTEND:${formatICSDate(dtEnd)}`,
      'RRULE:FREQ=WEEKLY;COUNT=15', // Repeat weekly for a 15-week academic semester!
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a generated .ics string as a file in browser.
 */
export function downloadICSFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
