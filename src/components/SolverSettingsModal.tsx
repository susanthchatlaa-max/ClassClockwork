import React from 'react';
import { SolverConfig } from '../types';
import { X, Sliders, Coffee, Clock, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

interface SolverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SolverConfig;
  onSaveConfig: (config: SolverConfig) => void;
}

export const SolverSettingsModal: React.FC<SolverSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = React.useState<SolverConfig>({ ...config });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">CSP Solver & Optimization Engine</h2>
              <p className="text-xs text-slate-400">
                Configure constraint satisfaction heuristics, lunch break lock, and solver limits
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

        {/* Form Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Lunch & Break Optimizer (Stretch feature) */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <Coffee className="w-4 h-4" />
                <span>Uniform Lunch & Break Optimizer</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.respectLunchBreak}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, respectLunchBreak: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-slate-400 text-[11px]">
              Enforces a synchronized, uniform lunch break across all department batches automatically. No lectures or continuous lab sessions will be scheduled during this reserved period.
            </p>

            {localConfig.respectLunchBreak && (
              <div className="flex items-center space-x-3 pt-2">
                <span className="text-slate-300">Reserved Lunch Period:</span>
                <select
                  value={localConfig.lunchPeriod}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, lunchPeriod: Number(e.target.value) })
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value={4}>Period 4 (12:00 PM - 01:00 PM)</option>
                  <option value={5}>Period 5 (01:00 PM - 02:00 PM)</option>
                </select>
              </div>
            )}
          </div>

          {/* Max Consecutive Hours */}
          <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Student Fatigue Avoidance</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Max Consecutive Lectures without Break:</span>
              <select
                value={localConfig.maxConsecutiveHours}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, maxConsecutiveHours: Number(e.target.value) })
                }
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              >
                <option value={2}>2 periods (2 hours)</option>
                <option value={3}>3 periods (3 hours - Recommended)</option>
                <option value={4}>4 periods (4 hours)</option>
              </select>
            </div>
          </div>

          {/* Heuristic Algorithm Info */}
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Minimum Remaining Values (MRV) & Degree Heuristic</span>
            </div>
            <p>
              • <strong>MRV Heuristic:</strong> Selects the most constrained subject/slot with the fewest remaining candidate rooms & periods first, pruning search space rapidly.
            </p>
            <p>
              • <strong>Macro-Slot Allocation:</strong> 3-hour and 2-hour continuous laboratory sessions are scheduled as atomic blocks before single lecture slots.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSaveConfig(localConfig);
              onClose();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
