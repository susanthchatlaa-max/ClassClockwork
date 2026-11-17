import React, { useState } from 'react';
import {
  Batch,
  Classroom,
  ClashViolation,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_PERIODS,
  Faculty,
  PeriodSlot,
  Subject,
  TimetableAllocation,
} from '../types';
import {
  Clock,
  MapPin,
  User,
  AlertCircle,
  GripVertical,
  Lock,
  Unlock,
  Trash2,
  Sparkles,
  Info,
  Maximize2,
  FlaskConical,
  GraduationCap,
  Users,
} from 'lucide-react';

interface TimetableGridProps {
  allocations: TimetableAllocation[];
  batches: Batch[];
  faculty: Faculty[];
  classrooms: Classroom[];
  subjects: Subject[];
  clashes: ClashViolation[];
  activeView: 'BATCH' | 'FACULTY' | 'ROOM' | 'MASTER';
  selectedBatchId: string;
  selectedFacultyId: string;
  selectedRoomId: string;
  lunchPeriod?: number;
  onMoveAllocation: (allocId: string, newDay: DayOfWeek, newPeriod: number) => void;
  onToggleLock: (allocId: string) => void;
  onDeleteAllocation: (allocId: string) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  allocations,
  batches,
  faculty,
  classrooms,
  subjects,
  clashes,
  activeView,
  selectedBatchId,
  selectedFacultyId,
  selectedRoomId,
  lunchPeriod = 4,
  onMoveAllocation,
  onToggleLock,
  onDeleteAllocation,
}) => {
  const [draggedAllocId, setDraggedAllocId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: DayOfWeek; period: number } | null>(null);

  const batchMap = new Map(batches.map((b) => [b.id, b]));
  const facultyMap = new Map(faculty.map((f) => [f.id, f]));
  const roomMap = new Map(classrooms.map((r) => [r.id, r]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Filter allocations based on the active view
  const filteredAllocations = allocations.filter((alloc) => {
    if (activeView === 'BATCH') {
      return !selectedBatchId || alloc.batchId === selectedBatchId;
    }
    if (activeView === 'FACULTY') {
      return !selectedFacultyId || alloc.facultyId === selectedFacultyId;
    }
    if (activeView === 'ROOM') {
      return !selectedRoomId || alloc.roomId === selectedRoomId;
    }
    return true; // MASTER view
  });

  // Find allocations that cover (day, period)
  const getAllocationsForSlot = (day: DayOfWeek, period: number): TimetableAllocation[] => {
    return filteredAllocations.filter((a) => {
      if (a.day !== day) return false;
      const end = a.period + (a.duration || 1) - 1;
      return period >= a.period && period <= end;
    });
  };

  // Check if a slot or allocation has any active clashes
  const getClashesForSlot = (day: DayOfWeek, period: number): ClashViolation[] => {
    return clashes.filter((c) => {
      if (c.day !== day) return false;
      const dur = c.duration || 1;
      const end = c.period + dur - 1;
      return period >= c.period && period <= end;
    });
  };

  // HTML5 Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, allocId: string) => {
    e.dataTransfer.setData('text/plain', allocId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAllocId(allocId);
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek, period: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day, period });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, day: DayOfWeek, period: number) => {
    e.preventDefault();
    const allocId = e.dataTransfer.getData('text/plain') || draggedAllocId;
    if (allocId) {
      onMoveAllocation(allocId, day, period);
    }
    setDraggedAllocId(null);
    setDragOverSlot(null);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm print-container">
      {/* Timetable Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-700 text-xs font-semibold text-slate-300">
              <th className="py-3.5 px-4 w-32 border-r border-slate-700/60 sticky left-0 z-20 bg-slate-900">
                <div className="flex items-center space-x-1.5 text-indigo-400">
                  <Clock className="w-4 h-4" />
                  <span>Day \ Period</span>
                </div>
              </th>
              {DEFAULT_PERIODS.map((slot) => {
                const isLunch = slot.period === lunchPeriod;
                return (
                  <th
                    key={slot.period}
                    className={`py-3 px-3 text-center border-r border-slate-700/50 min-w-[170px] ${
                      isLunch ? 'bg-amber-950/20 text-amber-300 font-bold' : ''
                    }`}
                  >
                    <div className="font-bold text-slate-100 flex items-center justify-center space-x-1">
                      <span>{slot.label}</span>
                      {isLunch && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          Recess
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 font-normal">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/60 text-xs">
            {DAYS_OF_WEEK.map((day) => (
              <tr key={day} className="hover:bg-slate-800/40 transition-colors">
                {/* Day Header Column */}
                <td className="py-4 px-4 font-bold text-slate-200 border-r border-slate-700/60 sticky left-0 z-10 bg-slate-900/95 flex flex-col justify-center">
                  <span className="text-sm text-white">{day}</span>
                  <span className="text-[11px] font-mono text-slate-400 font-normal">
                    {getAllocationsForSlot(day, 1).length +
                      getAllocationsForSlot(day, 2).length +
                      getAllocationsForSlot(day, 3).length +
                      getAllocationsForSlot(day, 5).length +
                      getAllocationsForSlot(day, 6).length +
                      getAllocationsForSlot(day, 7).length}{' '}
                    classes
                  </span>
                </td>

                {/* Period Cells */}
                {DEFAULT_PERIODS.map((slot) => {
                  const isLunch = slot.period === lunchPeriod;
                  const slotAllocations = getAllocationsForSlot(day, slot.period);
                  const slotClashes = getClashesForSlot(day, slot.period);
                  const isOver = dragOverSlot?.day === day && dragOverSlot?.period === slot.period;
                  const hasCriticalClash = slotClashes.some((c) => c.severity === 'CRITICAL');

                  return (
                    <td
                      key={slot.period}
                      onDragOver={(e) => handleDragOver(e, day, slot.period)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, slot.period)}
                      className={`p-2 border-r border-slate-700/40 align-top transition-all timetable-cell relative ${
                        isLunch ? 'bg-amber-950/10' : ''
                      } ${isOver ? 'bg-indigo-600/20 ring-2 ring-indigo-500 ring-inset' : ''} ${
                        hasCriticalClash ? 'bg-rose-950/40 clash-active' : ''
                      }`}
                    >
                      {/* Lunch Break Banner */}
                      {isLunch && slotAllocations.length === 0 && (
                        <div className="h-full min-h-[90px] flex flex-col items-center justify-center border border-dashed border-amber-500/30 rounded-xl bg-amber-500/5 text-amber-400/70 p-2 text-center select-none">
                          <span className="text-xs font-semibold tracking-wide uppercase">
                            Lunch Break
                          </span>
                          <span className="text-[10px] text-amber-500/60 font-mono mt-0.5">
                            Common Recess
                          </span>
                        </div>
                      )}

                      {/* Clashes Badge in Cell */}
                      {slotClashes.length > 0 && (
                        <div className="mb-1.5 flex items-center space-x-1 px-2 py-1 bg-rose-600/90 text-white rounded-md text-[10px] font-bold shadow-md animate-pulse">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {slotClashes.length} Clash{slotClashes.length > 1 ? 'es' : ''}
                          </span>
                        </div>
                      )}

                      {/* Scheduled Class Allocations in this slot */}
                      <div className="space-y-2">
                        {slotAllocations.map((alloc) => {
                          const sub = subjectMap.get(alloc.subjectId);
                          const fac = facultyMap.get(alloc.facultyId);
                          const room = roomMap.get(alloc.roomId);
                          const batch = batchMap.get(alloc.batchId);
                          const isStartPeriod = alloc.period === slot.period;
                          const isContinuous = (alloc.duration || 1) > 1;

                          // Check if this specific allocation is involved in clashes
                          const allocClashes = clashes.filter((c) =>
                            c.allocationIds.includes(alloc.id)
                          );
                          const isAllocClashed = allocClashes.length > 0;

                          // If this is a continuation period of a multi-period lab block
                          if (!isStartPeriod) {
                            return (
                              <div
                                key={alloc.id}
                                className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 flex items-center justify-between text-[11px]"
                              >
                                <div className="flex items-center space-x-1.5">
                                  <FlaskConical className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
                                  <span className="font-medium truncate">
                                    {sub?.code || 'LAB'} (Continuation)
                                  </span>
                                </div>
                                <span className="font-mono text-[9px] bg-indigo-900/80 px-1 py-0.5 rounded text-indigo-200">
                                  Block
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={alloc.id}
                              draggable={!alloc.isLocked}
                              onDragStart={(e) => handleDragStart(e, alloc.id)}
                              className={`group relative p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md ${
                                isAllocClashed
                                  ? 'bg-rose-950/80 border-rose-500 text-rose-100 shadow-rose-900/50 ring-1 ring-rose-400'
                                  : isContinuous
                                  ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/80 border-indigo-500/60 text-slate-100 hover:border-indigo-400'
                                  : 'bg-slate-900/90 border-slate-700/80 text-slate-100 hover:border-slate-500'
                              }`}
                            >
                              {/* Subject Header */}
                              <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-center space-x-1.5">
                                  <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                                  <span
                                    className="font-bold text-xs truncate max-w-[110px]"
                                    title={sub?.name || 'Subject'}
                                  >
                                    {sub?.name || 'Class'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {isContinuous && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 rounded font-semibold border border-indigo-500/40">
                                      {alloc.duration}h LAB
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleLock(alloc.id);
                                    }}
                                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                                    title={alloc.isLocked ? 'Unlock slot' : 'Lock slot to prevent auto-move'}
                                  >
                                    {alloc.isLocked ? (
                                      <Lock className="w-3 h-3 text-amber-400" />
                                    ) : (
                                      <Unlock className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteAllocation(alloc.id);
                                    }}
                                    className="text-slate-500 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-colors"
                                    title="Remove this scheduled slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Details: Faculty, Room, Batch */}
                              <div className="space-y-1 text-[11px] text-slate-300">
                                <div className="flex items-center space-x-1 text-slate-300">
                                  <User className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                  <span className="truncate font-medium">{fac?.name || 'TBA'}</span>
                                </div>

                                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                    <span className="truncate">{room?.name || 'Room'}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <GraduationCap className="w-3 h-3 text-sky-400 flex-shrink-0" />
                                    <span className="font-mono">{batch?.code || 'Batch'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Clash Reason Alert on Card */}
                              {isAllocClashed && (
                                <div className="mt-1.5 pt-1.5 border-t border-rose-500/40 text-[10px] text-rose-300 font-medium">
                                  {allocClashes[0].message}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Empty Slot Placeholder */}
                        {slotAllocations.length === 0 && !isLunch && (
                          <div className="h-20 rounded-xl border border-dashed border-slate-700/60 flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-500/80 transition-all select-none">
                            <span className="text-[10px]">Free Slot</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
