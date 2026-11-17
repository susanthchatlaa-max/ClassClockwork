import React from 'react';
import {
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Download,
  Printer,
  RotateCcw,
  BarChart2,
  Database,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Settings,
} from 'lucide-react';
import { ClashViolation } from '../types';

interface HeaderProps {
  totalAllocations: number;
  clashes: ClashViolation[];
  giniCoefficient: number;
  preferenceSatisfaction: number;
  isSolving: boolean;
  onGenerate: () => void;
  onTriggerDemoClash: () => void;
  onResetData: () => void;
  onExportICS: () => void;
  onPrint: () => void;
  onOpenResourceManager: () => void;
  onOpenAnalytics: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalAllocations,
  clashes,
  giniCoefficient,
  preferenceSatisfaction,
  isSolving,
  onGenerate,
  onTriggerDemoClash,
  onResetData,
  onExportICS,
  onPrint,
  onOpenResourceManager,
  onOpenAnalytics,
  onOpenSettings,
}) => {
  const criticalClashes = clashes.filter((c) => c.severity === 'CRITICAL');
  const isConflictFree = clashes.length === 0 && totalAllocations > 0;

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white flex-shrink-0">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Class<span className="text-indigo-400">Clockwork</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 font-mono">
                  ZeroClash Sprint
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Constraint Satisfaction Timetable Engine • MRV Backtracking Solver
              </p>
            </div>
          </div>

          {/* Real-time Metric Indicators */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Clash Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-medium ${
                clashes.length > 0
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse'
                  : isConflictFree
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {clashes.length > 0 ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>{clashes.length} Clash{clashes.length > 1 ? 'es' : ''} Detected</span>
                </>
              ) : isConflictFree ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Clashes (Conflict-Free)</span>
                </>
              ) : (
                <span>No Timetable Generated</span>
              )}
            </div>

            {/* Gini Metric Indicator */}
            <button
              onClick={onOpenAnalytics}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 transition-colors"
              title="Workload Balance Metric (Gini Coefficient)"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gini: <strong className="text-white font-mono">{giniCoefficient}</strong></span>
              <span className="text-[10px] text-slate-400">
                {giniCoefficient <= 0.15 ? '(Fair)' : '(Unequal)'}
              </span>
            </button>

            {/* Soft-Preference Match */}
            <div
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200"
              title="Soft-constraint faculty morning/afternoon preference satisfaction"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pref Fit: <strong className="text-amber-300 font-mono">{preferenceSatisfaction}%</strong></span>
            </div>

            {/* Total scheduled classes */}
            <div className="px-2.5 py-1.5 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-300 font-mono">
              <span className="text-slate-400">Slots:</span> <strong className="text-white">{totalAllocations}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Generate Button (CSP) */}
            <button
              onClick={onGenerate}
              disabled={isSolving}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
              <span>{isSolving ? 'Solving CSP...' : 'Generate Timetable'}</span>
            </button>

            {/* Intentional Clash Demo Button (Problem brief demo requirement) */}
            <button
              onClick={onTriggerDemoClash}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 text-xs font-medium rounded-xl transition-all shadow-sm active:scale-95"
              title="Demonstrates real-time conflict detector by forcing Dr. Sharma to teach in Room 102"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Trigger Demo Clash</span>
            </button>

            {/* Resource Manager Button */}
            <button
              onClick={onOpenResourceManager}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
              title="Open Academic Resource Manager"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Resources</span>
            </button>

            {/* iCal Export */}
            <button
              onClick={onExportICS}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
              title="Export as .ics iCalendar file for Google/Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>iCal</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={onPrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
              title="Print structured timetable or export as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / PDF</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all"
              title="Solver & Break Constraints Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={onResetData}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
              title="Reset to CS Benchmark Scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
