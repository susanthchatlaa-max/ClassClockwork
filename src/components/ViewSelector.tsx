import React from 'react';
import { Batch, Classroom, Faculty } from '../types';
import {
  GraduationCap,
  User,
  Building2,
  LayoutGrid,
  Check,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

interface ViewSelectorProps {
  activeView: 'BATCH' | 'FACULTY' | 'ROOM' | 'MASTER';
  onViewChange: (view: 'BATCH' | 'FACULTY' | 'ROOM' | 'MASTER') => void;
  batches: Batch[];
  faculty: Faculty[];
  classrooms: Classroom[];
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  selectedFacultyId: string;
  onSelectFaculty: (id: string) => void;
  selectedRoomId: string;
  onSelectRoom: (id: string) => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  activeView,
  onViewChange,
  batches,
  faculty,
  classrooms,
  selectedBatchId,
  onSelectBatch,
  selectedFacultyId,
  onSelectFaculty,
  selectedRoomId,
  onSelectRoom,
}) => {
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const selectedFac = faculty.find((f) => f.id === selectedFacultyId) || faculty[0];
  const selectedRoom = classrooms.find((r) => r.id === selectedRoomId) || classrooms[0];

  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 mb-6 backdrop-blur-sm no-print">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Main View Mode Selector */}
        <div className="flex flex-wrap items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onViewChange('BATCH')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'BATCH'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Batch View</span>
          </button>

          <button
            onClick={() => onViewChange('FACULTY')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'FACULTY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Faculty Schedule View</span>
          </button>

          <button
            onClick={() => onViewChange('ROOM')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'ROOM'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Room / Lab Utilization</span>
          </button>

          <button
            onClick={() => onViewChange('MASTER')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'MASTER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Master Matrix (All)</span>
          </button>
        </div>

        {/* Secondary Sub-Selector (Depends on active view) */}
        <div className="flex flex-wrap items-center gap-3">
          {activeView === 'BATCH' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Select Batch:</span>
              <div className="flex flex-wrap gap-1.5">
                {batches.map((batch) => {
                  const isSelected = batch.id === selectedBatchId;
                  return (
                    <button
                      key={batch.id}
                      onClick={() => onSelectBatch(batch.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span>{batch.code}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400">({batch.size} studs)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === 'FACULTY' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Select Faculty:</span>
              <select
                value={selectedFacultyId}
                onChange={(e) => onSelectFaculty(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department} - Max {f.maxWeeklyHours}h)
                  </option>
                ))}
              </select>
              {selectedFac && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    Pref: <strong className="text-indigo-300">{selectedFac.preferredSlot}</strong>
                  </span>
                  {selectedFac.unavailableSlots.length > 0 && (
                    <span className="bg-rose-950/40 text-rose-300 px-2 py-1 rounded border border-rose-500/30">
                      {selectedFac.unavailableSlots.length} unavail slot(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {activeView === 'ROOM' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Select Room / Lab:</span>
              <select
                value={selectedRoomId}
                onChange={(e) => onSelectRoom(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classrooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === 'LAB' ? 'LAB' : 'Lecture'} - Cap: {r.capacity})
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700 font-mono">
                    Cap: {selectedRoom.capacity}
                  </span>
                  <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">
                    {selectedRoom.building || 'Turing Block'}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeView === 'MASTER' && (
            <div className="text-xs text-slate-400 italic">
              Displaying all scheduled allocations across department batches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
