import React, { useState } from 'react';
import { ClashViolation } from '../types';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Users,
  Building2,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ClashAuditorPanelProps {
  clashes: ClashViolation[];
  onAutoResolve?: () => void;
  onSelectSlot?: (day: string, period: number) => void;
}

export const ClashAuditorPanel: React.FC<ClashAuditorPanelProps> = ({
  clashes,
  onAutoResolve,
  onSelectSlot,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const criticalClashes = clashes.filter((c) => c.severity === 'CRITICAL');
  const warningClashes = clashes.filter((c) => c.severity === 'WARNING');

  if (clashes.length === 0) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 mb-5 flex items-center justify-between text-emerald-300 shadow-sm transition-all">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm flex items-center space-x-2">
              <span>Schedule Auditor: Zero Clashes Detected</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
                Verified Conflict-Free
              </span>
            </div>
            <p className="text-xs text-emerald-400/80">
              Backtracking CSP constraint satisfaction active. No faculty double-bookings, room conflicts, or capacity overages.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Auditor Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-950/50 border-2 border-rose-500/50 rounded-xl mb-5 shadow-lg shadow-rose-950/40 overflow-hidden transition-all">
      {/* Header bar */}
      <div className="bg-rose-900/40 px-4 py-3 flex items-center justify-between border-b border-rose-500/30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/30 rounded-lg text-rose-300 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-rose-200 text-sm">
                Real-Time Clash Auditor: Rule Violations Detected!
              </h3>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full animate-bounce">
                {criticalClashes.length} Critical
              </span>
              {warningClashes.length > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-600/80 text-amber-100 rounded-full">
                  {warningClashes.length} Warnings
                </span>
              )}
            </div>
            <p className="text-xs text-rose-300/80">
              Immediate conflict resolution required. Adjust overlapping blocks or trigger CSP auto-resolve.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onAutoResolve && (
            <button
              onClick={onAutoResolve}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-all shadow-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Resolve with CSP</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-800/40 rounded-lg transition-all"
            title={isExpanded ? 'Collapse auditor' : 'Expand auditor'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Clash List */}
      {isExpanded && (
        <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
          {clashes.map((violation) => {
            const isCritical = violation.severity === 'CRITICAL';
            return (
              <div
                key={violation.id}
                onClick={() => onSelectSlot && onSelectSlot(violation.day, violation.period)}
                className={`p-3 rounded-lg border flex items-start justify-between cursor-pointer transition-all hover:translate-x-1 ${
                  isCritical
                    ? 'bg-rose-900/30 border-rose-500/40 hover:bg-rose-900/50 hover:border-rose-400'
                    : 'bg-amber-900/20 border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {isCritical ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-rose-100 flex items-center space-x-2">
                      <span>{violation.message}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-rose-300/70 mt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{violation.day}</span>
                      </span>
                      <span className="font-mono bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Period {violation.period}
                        {violation.duration && violation.duration > 1
                          ? ` - ${violation.period + violation.duration - 1}`
                          : ''}
                      </span>
                      <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 rounded bg-rose-800/50 text-rose-200">
                        {violation.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-rose-300/60 italic flex items-center space-x-1">
                  <span>Click to view slot</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
