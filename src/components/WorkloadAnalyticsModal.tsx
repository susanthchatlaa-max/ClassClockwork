import React from 'react';
import { Faculty, TimetableAllocation, Subject } from '../types';
import { X, BarChart2, Sparkles, CheckCircle2, TrendingUp, Award, Info } from 'lucide-react';
import { calculateGiniCoefficient, calculatePreferenceSatisfaction } from '../solver';

interface WorkloadAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty[];
  allocations: TimetableAllocation[];
  subjects: Subject[];
}

export const WorkloadAnalyticsModal: React.FC<WorkloadAnalyticsModalProps> = ({
  isOpen,
  onClose,
  faculty,
  allocations,
  subjects,
}) => {
  if (!isOpen) return null;

  const gini = calculateGiniCoefficient(faculty, allocations);
  const prefSat = calculatePreferenceSatisfaction(faculty, allocations);

  // Compute workload for each faculty member
  const facultyStats = faculty.map((f) => {
    const fAllocs = allocations.filter((a) => a.facultyId === f.id);
    const assignedHours = fAllocs.reduce((sum, a) => sum + (a.duration || 1), 0);
    const utilizationPct = Math.round((assignedHours / (f.maxWeeklyHours || 1)) * 100);

    // Morning vs afternoon breakdown
    const morningHours = fAllocs
      .filter((a) => a.period <= 3)
      .reduce((sum, a) => sum + (a.duration || 1), 0);
    const afternoonHours = assignedHours - morningHours;

    let prefMatch = 'N/A (Any)';
    if (f.preferredSlot === 'MORNING') {
      prefMatch = morningHours >= afternoonHours ? 'Satisfied (Morning)' : 'Suboptimal (Afternoon)';
    } else if (f.preferredSlot === 'AFTERNOON') {
      prefMatch = afternoonHours >= morningHours ? 'Satisfied (Afternoon)' : 'Suboptimal (Morning)';
    }

    return {
      faculty: f,
      assignedHours,
      utilizationPct,
      morningHours,
      afternoonHours,
      prefMatch,
    };
  });

  // Sort by utilization descending
  facultyStats.sort((a, b) => b.assignedHours - a.assignedHours);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Faculty Workload Equity & Preference Analytics
              </h2>
              <p className="text-xs text-slate-400">
                Gini coefficient load balancing and soft-constraint preference fulfillment
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gini Metric Card */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Gini Workload Index</span>
                <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{gini}</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    gini <= 0.15
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : gini <= 0.25
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {gini <= 0.15 ? 'Highly Equitable' : gini <= 0.25 ? 'Moderate' : 'Disparate'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Mathematical measure of dispersion. Closer to 0.00 signifies fair teaching distribution.
              </p>
            </div>

            {/* Soft-Constraint Satisfaction */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Soft Preference Fit</span>
                <span className="p-1 bg-amber-500/20 text-amber-400 rounded">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-amber-300 font-mono">
                  {prefSat}%
                </span>
                <span className="text-xs text-slate-400">Morning / Afternoon</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Percentage of teaching sessions scheduled in faculty-requested slot windows.
              </p>
            </div>

            {/* Total Allocated Hours */}
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Department Hours</span>
                <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {allocations.reduce((sum, a) => sum + (a.duration || 1), 0)}
                </span>
                <span className="text-xs text-slate-400">hrs/week across {faculty.length} faculty</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated across lecture macro-slots and multi-period laboratories.
              </p>
            </div>
          </div>

          {/* Gini Formula Card */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold">
              <Info className="w-4 h-4" />
              <span>Gini Coefficient Formula for Workload Equity</span>
            </div>
            <div className="font-mono bg-slate-900/80 p-2.5 rounded-lg text-indigo-200 text-center border border-indigo-500/20">
              G = [ ∑ᵢ ∑ⱼ |xᵢ - xⱼ| ] / [ 2 · n · ∑ᵢ xᵢ ]
            </div>
            <p className="text-slate-300 text-[11px]">
              Where <strong>xᵢ</strong> is weekly teaching hours of faculty member <strong>i</strong>, and <strong>n</strong> is total active faculty count ({faculty.length}). The CSP solver penalizes allocations that cause large deviations from mean departmental teaching load.
            </p>
          </div>

          {/* Faculty Workload Breakdown Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-800/90 font-bold text-xs text-slate-200 border-b border-slate-700">
              Individual Faculty Load & Preference Breakdown
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Faculty Member</th>
                  <th className="p-3">Assigned Load</th>
                  <th className="p-3">Utilization Bar</th>
                  <th className="p-3">Morning / Afternoon</th>
                  <th className="p-3">Preference Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {facultyStats.map((stat) => (
                  <tr key={stat.faculty.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">
                      <div>{stat.faculty.name}</div>
                      <div className="text-[10px] text-slate-400">{stat.faculty.department}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="font-bold text-white">{stat.assignedHours}</span> /{' '}
                      {stat.faculty.maxWeeklyHours} hrs
                    </td>
                    <td className="p-3 w-48">
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stat.utilizationPct > 100
                              ? 'bg-rose-500'
                              : stat.utilizationPct >= 75
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(stat.utilizationPct, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {stat.utilizationPct}% capacity
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {stat.morningHours}h morn / {stat.afternoonHours}h aft
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          stat.prefMatch.includes('Satisfied')
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : stat.prefMatch.includes('Suboptimal')
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {stat.prefMatch}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
