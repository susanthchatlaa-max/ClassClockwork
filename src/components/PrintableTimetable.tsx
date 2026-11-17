import React from 'react';
import {
  Batch,
  Classroom,
  DAYS_OF_WEEK,
  DEFAULT_PERIODS,
  Faculty,
  Subject,
  TimetableAllocation,
} from '../types';

interface PrintableTimetableProps {
  batch?: Batch;
  facultyMember?: Faculty;
  allocations: TimetableAllocation[];
  subjects: Subject[];
  faculty: Faculty[];
  classrooms: Classroom[];
  lunchPeriod?: number;
}

export const PrintableTimetable: React.FC<PrintableTimetableProps> = ({
  batch,
  facultyMember,
  allocations,
  subjects,
  faculty,
  classrooms,
  lunchPeriod = 4,
}) => {
  const subMap = new Map(subjects.map((s) => [s.id, s]));
  const facMap = new Map(faculty.map((f) => [f.id, f]));
  const roomMap = new Map(classrooms.map((r) => [r.id, r]));

  const filteredAllocs = allocations.filter((a) => {
    if (batch) return a.batchId === batch.id;
    if (facultyMember) return a.facultyId === facultyMember.id;
    return true;
  });

  const getSlotAllocation = (day: string, period: number) => {
    return filteredAllocs.find((a) => {
      if (a.day !== day) return false;
      const end = a.period + (a.duration || 1) - 1;
      return period >= a.period && period <= end;
    });
  };

  return (
    <div className="print-only p-8 text-black bg-white">
      {/* College Letterhead */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-extrabold uppercase tracking-wider">
          Department of Computer Science & Engineering
        </h1>
        <h2 className="text-lg font-bold text-slate-800">
          Official Weekly Academic Timetable • Academic Year 2026-2027
        </h2>
        <div className="text-sm mt-1 text-slate-600 font-medium">
          {batch ? (
            <span>
              Target Cohort: <strong>{batch.name}</strong> ({batch.code}) | Student Strength:{' '}
              {batch.size}
            </span>
          ) : facultyMember ? (
            <span>
              Faculty Member: <strong>{facultyMember.name}</strong> | Department:{' '}
              {facultyMember.department} | Max Hours: {facultyMember.maxWeeklyHours}h
            </span>
          ) : (
            <span>Master Departmental Schedule</span>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <table className="w-full border-2 border-black border-collapse text-center text-xs mb-6">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-black">
            <th className="border border-black p-2 font-bold w-24">Day \ Period</th>
            {DEFAULT_PERIODS.map((p) => (
              <th key={p.period} className="border border-black p-2 font-bold">
                <div>{p.label}</div>
                <div className="text-[10px] text-slate-600 font-normal">
                  {p.startTime} - {p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS_OF_WEEK.map((day) => (
            <tr key={day} className="border-b border-black">
              <td className="border border-black p-2 font-bold bg-slate-50">{day}</td>
              {DEFAULT_PERIODS.map((slot) => {
                const isLunch = slot.period === lunchPeriod;
                if (isLunch) {
                  return (
                    <td
                      key={slot.period}
                      className="border border-black p-2 bg-slate-100 font-bold uppercase text-[10px] text-slate-600"
                    >
                      Lunch Break
                    </td>
                  );
                }

                const alloc = getSlotAllocation(day, slot.period);
                if (!alloc) {
                  return <td key={slot.period} className="border border-black p-2 text-slate-400">-</td>;
                }

                const sub = subMap.get(alloc.subjectId);
                const fac = facMap.get(alloc.facultyId);
                const room = roomMap.get(alloc.roomId);

                return (
                  <td key={slot.period} className="border border-black p-2 bg-slate-50">
                    <div className="font-bold text-black">{sub?.code || 'Course'}</div>
                    <div className="text-[10px] text-slate-700">{sub?.name}</div>
                    <div className="text-[10px] font-semibold text-slate-900 mt-0.5">
                      {room?.name} • {fac?.name}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Course & Faculty Reference Legend */}
      <div className="grid grid-cols-2 gap-4 text-xs border border-black p-3 mb-8">
        <div>
          <h4 className="font-bold border-b border-slate-400 pb-1 mb-1">Course Details</h4>
          <ul className="space-y-0.5 text-[11px]">
            {subjects
              .filter((s) => !batch || s.batchId === batch.id)
              .map((s) => (
                <li key={s.id}>
                  <strong>{s.code}:</strong> {s.name} ({s.credits} Credits - {s.type})
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold border-b border-slate-400 pb-1 mb-1">Faculty In-Charge</h4>
          <ul className="space-y-0.5 text-[11px]">
            {faculty.map((f) => (
              <li key={f.id}>
                <strong>{f.name}:</strong> {f.department} ({f.email})
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end pt-8 px-4 text-xs">
        <div className="text-center">
          <div className="w-48 border-t border-black pt-1 font-bold">Timetable In-Charge</div>
          <div className="text-[10px] text-slate-600">Department Committee</div>
        </div>
        <div className="text-center">
          <div className="w-48 border-t border-black pt-1 font-bold">Head of Department</div>
          <div className="text-[10px] text-slate-600">Computer Science & Engg.</div>
        </div>
        <div className="text-center">
          <div className="w-48 border-t border-black pt-1 font-bold">Dean of Academic Affairs</div>
          <div className="text-[10px] text-slate-600">College Administration</div>
        </div>
      </div>
    </div>
  );
};
