import React, { useState } from 'react';
import {
  Batch,
  Classroom,
  Faculty,
  Subject,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_PERIODS,
} from '../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  User,
  Building2,
  GraduationCap,
  Check,
  Cpu,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ResourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  batches: Batch[];
  faculty: Faculty[];
  classrooms: Classroom[];
  subjects: Subject[];
  onSaveBatch: (batch: Batch) => void;
  onDeleteBatch: (id: string) => void;
  onSaveFaculty: (faculty: Faculty) => void;
  onDeleteFaculty: (id: string) => void;
  onSaveClassroom: (room: Classroom) => void;
  onDeleteClassroom: (id: string) => void;
  onSaveSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({
  isOpen,
  onClose,
  batches,
  faculty,
  classrooms,
  subjects,
  onSaveBatch,
  onDeleteBatch,
  onSaveFaculty,
  onDeleteFaculty,
  onSaveClassroom,
  onDeleteClassroom,
  onSaveSubject,
  onDeleteSubject,
}) => {
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'FACULTY' | 'ROOMS' | 'BATCHES'>('SUBJECTS');

  // Form states for adding/editing
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<Partial<Faculty> | null>(null);
  const [editingRoom, setEditingRoom] = useState<Partial<Classroom> | null>(null);
  const [editingBatch, setEditingBatch] = useState<Partial<Batch> | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Academic Resource Manager</h2>
              <p className="text-xs text-slate-400">
                Configure Subjects, Faculty teaching limits, Classrooms & Lab equipment, and Student Batches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex space-x-2">
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SUBJECTS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects ({subjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FACULTY')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'FACULTY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Faculty ({faculty.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ROOMS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ROOMS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Classrooms & Labs ({classrooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BATCHES')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'BATCHES'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Batches ({batches.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: SUBJECTS */}
          {activeTab === 'SUBJECTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Configured Subjects & Continuous Lab Macro-Slots
                </span>
                <button
                  onClick={() =>
                    setEditingSubject({
                      id: `sub-${Date.now()}`,
                      name: '',
                      code: '',
                      batchId: batches[0]?.id || '',
                      facultyId: faculty[0]?.id || '',
                      type: 'THEORY',
                      duration: 1,
                      weeklyHours: 3,
                      credits: 3,
                      requiredRoomType: 'LECTURE_HALL',
                      requiredEquipment: [],
                      color: '#6366F1',
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              {/* Subject Form Drawer */}
              {editingSubject && (
                <div className="p-4 bg-slate-800/90 border border-indigo-500/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-indigo-300">
                    {editingSubject.id && subjects.some((s) => s.id === editingSubject.id)
                      ? 'Edit Subject'
                      : 'New Subject Definition'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Subject Name</label>
                      <input
                        type="text"
                        value={editingSubject.name || ''}
                        onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                        placeholder="e.g. Operating Systems"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Course Code</label>
                      <input
                        type="text"
                        value={editingSubject.code || ''}
                        onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                        placeholder="e.g. CS401"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Subject Type</label>
                      <select
                        value={editingSubject.type || 'THEORY'}
                        onChange={(e) => {
                          const val = e.target.value as 'THEORY' | 'LAB';
                          setEditingSubject({
                            ...editingSubject,
                            type: val,
                            requiredRoomType: val === 'LAB' ? 'LAB' : 'LECTURE_HALL',
                            duration: val === 'LAB' ? 3 : 1,
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="THEORY">Theory Lecture (1 hour slots)</option>
                        <option value="LAB">Laboratory (Continuous Multi-period Block)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Block Duration ({editingSubject.duration} period(s))
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        value={editingSubject.duration || 1}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, duration: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Weekly Periods Needed</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingSubject.weeklyHours || 3}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, weeklyHours: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={editingSubject.credits || 3}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, credits: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Assigned Batch</label>
                      <select
                        value={editingSubject.batchId || ''}
                        onChange={(e) => setEditingSubject({ ...editingSubject, batchId: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Instructor Faculty</label>
                      <select
                        value={editingSubject.facultyId || ''}
                        onChange={(e) =>
                          setEditingSubject({ ...editingSubject, facultyId: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        {faculty.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Required Room Type</label>
                      <select
                        value={editingSubject.requiredRoomType || 'LECTURE_HALL'}
                        onChange={(e) =>
                          setEditingSubject({
                            ...editingSubject,
                            requiredRoomType: e.target.value as any,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Specialized Laboratory</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingSubject(null)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingSubject.name && editingSubject.code) {
                          onSaveSubject(editingSubject as Subject);
                          setEditingSubject(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
                    >
                      Save Subject
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Subjects */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
                    <tr>
                      <th className="p-3">Course</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Faculty</th>
                      <th className="p-3">Type / Duration</th>
                      <th className="p-3">Weekly Hrs</th>
                      <th className="p-3">Room Type</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {subjects.map((s) => {
                      const fac = faculty.find((f) => f.id === s.facultyId);
                      const batch = batches.find((b) => b.id === s.batchId);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-bold text-white">{s.name}</div>
                            <div className="font-mono text-[10px] text-indigo-400">{s.code}</div>
                          </td>
                          <td className="p-3">{batch?.code || 'N/A'}</td>
                          <td className="p-3">{fac?.name || 'TBA'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                s.type === 'LAB'
                                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {s.type} ({s.duration}h)
                            </span>
                          </td>
                          <td className="p-3 font-mono">{s.weeklyHours} hrs</td>
                          <td className="p-3 text-[11px] text-slate-400">
                            {s.requiredRoomType === 'LAB' ? 'Lab Required' : 'Lecture Hall'}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => setEditingSubject(s)}
                              className="p-1 hover:text-indigo-400"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSubject(s.id)}
                              className="p-1 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY */}
          {activeTab === 'FACULTY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Faculty Directory, Teaching Limits & Availability Constraints
                </span>
                <button
                  onClick={() =>
                    setEditingFaculty({
                      id: `fac-${Date.now()}`,
                      name: '',
                      email: '',
                      department: 'Computer Science',
                      maxWeeklyHours: 12,
                      preferredSlot: 'ANY',
                      unavailableSlots: [],
                      color: '#3B82F6',
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Faculty</span>
                </button>
              </div>

              {/* Faculty Form Drawer */}
              {editingFaculty && (
                <div className="p-4 bg-slate-800/90 border border-indigo-500/40 rounded-xl space-y-4">
                  <div className="font-bold text-xs text-indigo-300">
                    {editingFaculty.id && faculty.some((f) => f.id === editingFaculty.id)
                      ? 'Edit Faculty Member'
                      : 'New Faculty Definition'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={editingFaculty.name || ''}
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
                        placeholder="e.g. Dr. Ramesh Sharma"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={editingFaculty.email || ''}
                        onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
                        placeholder="e.g. r.sharma@college.edu"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Max Weekly Hours</label>
                      <input
                        type="number"
                        min="4"
                        max="24"
                        value={editingFaculty.maxWeeklyHours || 12}
                        onChange={(e) =>
                          setEditingFaculty({ ...editingFaculty, maxWeeklyHours: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Preferred Slot</label>
                      <select
                        value={editingFaculty.preferredSlot || 'ANY'}
                        onChange={(e) =>
                          setEditingFaculty({ ...editingFaculty, preferredSlot: e.target.value as any })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="ANY">Any Time</option>
                        <option value="MORNING">Morning Slots (09:00 - 12:00)</option>
                        <option value="AFTERNOON">Afternoon Slots (01:00 - 04:00)</option>
                      </select>
                    </div>
                  </div>

                  {/* Interactive Unavailable Slots Grid Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Unavailable Slots Grid (Click slots when faculty CANNOT teach):
                    </label>
                    <div className="border border-slate-700 rounded-lg overflow-x-auto p-2 bg-slate-900">
                      <table className="w-full text-center text-[10px]">
                        <thead>
                          <tr className="text-slate-400">
                            <th className="p-1 text-left">Day \ Period</th>
                            {DEFAULT_PERIODS.map((p) => (
                              <th key={p.period} className="p-1">
                                P{p.period}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS_OF_WEEK.map((day) => (
                            <tr key={day} className="border-t border-slate-800">
                              <td className="p-1 text-left font-bold text-slate-300">{day}</td>
                              {DEFAULT_PERIODS.map((slot) => {
                                const isUnavail = (editingFaculty.unavailableSlots || []).some(
                                  (u) => u.day === day && u.period === slot.period
                                );
                                return (
                                  <td key={slot.period} className="p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = editingFaculty.unavailableSlots || [];
                                        if (isUnavail) {
                                          setEditingFaculty({
                                            ...editingFaculty,
                                            unavailableSlots: cur.filter(
                                              (u) => !(u.day === day && u.period === slot.period)
                                            ),
                                          });
                                        } else {
                                          setEditingFaculty({
                                            ...editingFaculty,
                                            unavailableSlots: [...cur, { day, period: slot.period }],
                                          });
                                        }
                                      }}
                                      className={`w-7 h-7 rounded flex items-center justify-center font-mono transition-all ${
                                        isUnavail
                                          ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                      }`}
                                      title={isUnavail ? 'Marked Unavailable' : 'Available'}
                                    >
                                      {isUnavail ? '✕' : '✓'}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingFaculty(null)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingFaculty.name) {
                          onSaveFaculty(editingFaculty as Faculty);
                          setEditingFaculty(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
                    >
                      Save Faculty
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Faculty */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
                    <tr>
                      <th className="p-3">Faculty Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Max Weekly Limit</th>
                      <th className="p-3">Preferred Slot</th>
                      <th className="p-3">Unavailable Time Restrictions</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {faculty.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="font-bold text-white">{f.name}</div>
                          <div className="text-[10px] text-slate-400">{f.email}</div>
                        </td>
                        <td className="p-3">{f.department}</td>
                        <td className="p-3 font-mono font-semibold">{f.maxWeeklyHours} hrs</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 font-mono">
                            {f.preferredSlot}
                          </span>
                        </td>
                        <td className="p-3">
                          {f.unavailableSlots.length === 0 ? (
                            <span className="text-emerald-400 text-[11px]">Fully Available</span>
                          ) : (
                            <span className="text-rose-400 text-[11px] font-mono">
                              {f.unavailableSlots.length} slot(s) blocked
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingFaculty(f)}
                            className="p-1 hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteFaculty(f.id)}
                            className="p-1 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CLASSROOMS & LABS */}
          {activeTab === 'ROOMS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Lecture Halls, Capacity & Specialized Laboratory Equipment
                </span>
                <button
                  onClick={() =>
                    setEditingRoom({
                      id: `room-${Date.now()}`,
                      name: '',
                      code: '',
                      capacity: 50,
                      type: 'LECTURE_HALL',
                      equipment: ['Projector'],
                      building: 'Turing Block',
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Room</span>
                </button>
              </div>

              {/* Room Form Drawer */}
              {editingRoom && (
                <div className="p-4 bg-slate-800/90 border border-indigo-500/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-indigo-300">
                    {editingRoom.id && classrooms.some((r) => r.id === editingRoom.id)
                      ? 'Edit Classroom / Lab'
                      : 'New Classroom Definition'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Room Name</label>
                      <input
                        type="text"
                        value={editingRoom.name || ''}
                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                        placeholder="e.g. OS & Systems Lab 201"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Room Code</label>
                      <input
                        type="text"
                        value={editingRoom.code || ''}
                        onChange={(e) => setEditingRoom({ ...editingRoom, code: e.target.value })}
                        placeholder="e.g. SYS-LAB-201"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Seating Capacity</label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={editingRoom.capacity || 50}
                        onChange={(e) =>
                          setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Space Type</label>
                      <select
                        value={editingRoom.type || 'LECTURE_HALL'}
                        onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Specialized Laboratory</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Installed Equipment (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={(editingRoom.equipment || []).join(', ')}
                      onChange={(e) =>
                        setEditingRoom({
                          ...editingRoom,
                          equipment: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Linux Workstations, Dual Monitors, Dedicated Server Rack"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingRoom(null)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingRoom.name) {
                          onSaveClassroom(editingRoom as Classroom);
                          setEditingRoom(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
                    >
                      Save Room
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Classrooms */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
                    <tr>
                      <th className="p-3">Room Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Installed Equipment</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {classrooms.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{r.name}</td>
                        <td className="p-3 font-mono text-indigo-400">{r.code}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              r.type === 'LAB'
                                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{r.capacity} seats</td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {r.equipment.join(', ') || 'Standard Whiteboard'}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingRoom(r)}
                            className="p-1 hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteClassroom(r.id)}
                            className="p-1 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BATCHES */}
          {activeTab === 'BATCHES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Student Cohorts & Batch Sizes
                </span>
                <button
                  onClick={() =>
                    setEditingBatch({
                      id: `batch-${Date.now()}`,
                      name: '',
                      code: '',
                      size: 50,
                      department: 'Computer Science & Engineering',
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Batch</span>
                </button>
              </div>

              {/* Batch Form Drawer */}
              {editingBatch && (
                <div className="p-4 bg-slate-800/90 border border-indigo-500/40 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-indigo-300">
                    {editingBatch.id && batches.some((b) => b.id === editingBatch.id)
                      ? 'Edit Batch'
                      : 'New Batch Definition'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Batch Name</label>
                      <input
                        type="text"
                        value={editingBatch.name || ''}
                        onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                        placeholder="e.g. CS-4th Sem (Section A)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Batch Code</label>
                      <input
                        type="text"
                        value={editingBatch.code || ''}
                        onChange={(e) => setEditingBatch({ ...editingBatch, code: e.target.value })}
                        placeholder="e.g. CS-4A"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Student Headcount</label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={editingBatch.size || 50}
                        onChange={(e) =>
                          setEditingBatch({ ...editingBatch, size: Number(e.target.value) })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Department</label>
                      <input
                        type="text"
                        value={editingBatch.department || 'Computer Science & Engineering'}
                        onChange={(e) => setEditingBatch({ ...editingBatch, department: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setEditingBatch(null)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingBatch.name && editingBatch.code) {
                          onSaveBatch(editingBatch as Batch);
                          setEditingBatch(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
                    >
                      Save Batch
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Batches */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700/60 font-semibold">
                    <tr>
                      <th className="p-3">Batch Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Headcount</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white">{b.name}</td>
                        <td className="p-3 font-mono text-indigo-400">{b.code}</td>
                        <td className="p-3 font-mono">{b.size} students</td>
                        <td className="p-3 text-slate-400">{b.department}</td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => setEditingBatch(b)}
                            className="p-1 hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteBatch(b.id)}
                            className="p-1 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
          >
            Done Managing Resources
          </button>
        </div>
      </div>
    </div>
  );
};
