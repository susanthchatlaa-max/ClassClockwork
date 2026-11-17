import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Batch,
  Classroom,
  ClashViolation,
  DayOfWeek,
  Faculty,
  SolverConfig,
  Subject,
  TimetableAllocation,
  TimetableDataset,
} from './types';
import { INITIAL_DATASET } from './sampleData';
import { TimetableCSPSolver, calculateGiniCoefficient, calculatePreferenceSatisfaction } from './solver';
import { auditTimetable } from './validator';
import { Header } from './components/Header';
import { ViewSelector } from './components/ViewSelector';
import { TimetableGrid } from './components/TimetableGrid';
import { ClashAuditorPanel } from './components/ClashAuditorPanel';
import { ResourceManager } from './components/ResourceManager';
import { WorkloadAnalyticsModal } from './components/WorkloadAnalyticsModal';
import { SolverSettingsModal } from './components/SolverSettingsModal';
import { PrintableTimetable } from './components/PrintableTimetable';
import { generateICS, downloadICSFile } from './icsExporter';
import {
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export const App: React.FC = () => {
  // Main Dataset State
  const [batches, setBatches] = useState<Batch[]>(INITIAL_DATASET.batches);
  const [faculty, setFaculty] = useState<Faculty[]>(INITIAL_DATASET.faculty);
  const [classrooms, setClassrooms] = useState<Classroom[]>(INITIAL_DATASET.classrooms);
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_DATASET.subjects);
  const [allocations, setAllocations] = useState<TimetableAllocation[]>(INITIAL_DATASET.allocations);

  // View States
  const [activeView, setActiveView] = useState<'BATCH' | 'FACULTY' | 'ROOM' | 'MASTER'>('BATCH');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(INITIAL_DATASET.batches[0].id);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(INITIAL_DATASET.faculty[0].id);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(INITIAL_DATASET.classrooms[0].id);

  // Solver & Settings State
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solverStats, setSolverStats] = useState<{
    executionTimeMs: number;
    iterations: number;
    lastGenerated: Date | null;
  }>({
    executionTimeMs: 0,
    iterations: 0,
    lastGenerated: null,
  });

  const [solverConfig, setSolverConfig] = useState<SolverConfig>({
    respectLunchBreak: true,
    lunchPeriod: 4,
    maxConsecutiveHours: 3,
    timeoutMs: 5000,
    allowSoftRelaxation: true,
  });

  // Modal Dialogs
  const [isResourceManagerOpen, setIsResourceManagerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Load from backend on startup if available
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Backend not ready');
      })
      .then((data: TimetableDataset) => {
        if (data && data.batches && data.batches.length > 0) {
          setBatches(data.batches);
          setFaculty(data.faculty);
          setClassrooms(data.classrooms);
          setSubjects(data.subjects);
          if (data.allocations && data.allocations.length > 0) {
            setAllocations(data.allocations);
          }
        }
      })
      .catch((err) => {
        console.log('Using local dataset initialized in browser:', err.message);
      });
  }, []);

  // Real-Time Clash Auditor: scans active allocations continuously
  const clashes: ClashViolation[] = useMemo(() => {
    return auditTimetable({
      batches,
      faculty,
      classrooms,
      subjects,
      allocations,
      lunchPeriod: solverConfig.respectLunchBreak ? solverConfig.lunchPeriod : 0,
    });
  }, [batches, faculty, classrooms, subjects, allocations, solverConfig]);

  // Real-time Gini Workload & Soft-Preference Metrics
  const giniCoefficient = useMemo(() => {
    return calculateGiniCoefficient(faculty, allocations);
  }, [faculty, allocations]);

  const preferenceSatisfaction = useMemo(() => {
    return calculatePreferenceSatisfaction(faculty, allocations);
  }, [faculty, allocations]);

  // Save allocations to backend store
  const syncAllocations = (newAllocations: TimetableAllocation[]) => {
    setAllocations(newAllocations);
    fetch('/api/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocations: newAllocations }),
    }).catch(() => {});
  };

  // Run Backtracking CSP Solver with MRV
  const handleGenerate = async () => {
    setIsSolving(true);
    setDemoNotice(null);

    // Give browser a short tick for UI loading state
    setTimeout(() => {
      const startTime = performance.now();
      const solver = new TimetableCSPSolver(batches, faculty, classrooms, subjects, solverConfig);
      const result = solver.solve();
      const duration = Math.round(performance.now() - startTime);

      setAllocations(result.allocations);
      setSolverStats({
        executionTimeMs: duration,
        iterations: result.totalIterations,
        lastGenerated: new Date(),
      });
      setIsSolving(false);

      syncAllocations(result.allocations);

      if (result.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 250);
  };

  // Auto-generate on first load if empty
  useEffect(() => {
    if (allocations.length === 0) {
      handleGenerate();
    }
  }, []);

  // Trigger Intentional Clash (Presenter Demo Scenario from Problem Brief):
  // "The presenter deliberately drags a class into a slot where the professor already teaches;
  //  the system instantly flashes a red conflict badge: 'Clash: Dr. Sharma already booked in Room 102'"
  const handleTriggerDemoClash = () => {
    const drSharma = faculty.find((f) => f.name.includes('Sharma')) || faculty[0];
    const room102 = classrooms.find((r) => r.code === 'LH-102') || classrooms[1];
    const subOS = subjects.find((s) => s.facultyId === drSharma.id && s.type === 'THEORY') || subjects[0];

    // Create an intentional overlapping allocation at Monday Period 2
    const clashAllocation: TimetableAllocation = {
      id: `demo-clash-${Date.now()}`,
      subjectId: subOS.id,
      batchId: 'batch-cs4b', // Batch B
      facultyId: drSharma.id, // Same faculty: Dr. Sharma!
      roomId: room102.id, // Room 102!
      day: 'Monday',
      period: 2,
      duration: 1,
    };

    // Also ensure Dr. Sharma has another class on Monday Period 2 in Room 101 with CS-4A
    const baseAllocation: TimetableAllocation = {
      id: `demo-base-${Date.now()}`,
      subjectId: subOS.id,
      batchId: 'batch-cs4a',
      facultyId: drSharma.id,
      roomId: classrooms[0].id, // Room 101
      day: 'Monday',
      period: 2,
      duration: 1,
    };

    const newAllocations = allocations.filter(
      (a) => !(a.day === 'Monday' && a.period === 2 && a.batchId === 'batch-cs4b')
    );
    newAllocations.push(clashAllocation);
    if (!newAllocations.some((a) => a.day === 'Monday' && a.period === 2 && a.facultyId === drSharma.id)) {
      newAllocations.push(baseAllocation);
    }

    setAllocations(newAllocations);
    setDemoNotice(
      `💥 Intentional Demo Clash Triggered: Dr. Sharma forced into conflicting slot at Monday Period 2 in ${room102.name} while teaching elsewhere!`
    );
  };

  // Manual Drag-and-Drop Slot Move
  const handleMoveAllocation = (allocId: string, newDay: DayOfWeek, newPeriod: number) => {
    const target = allocations.find((a) => a.id === allocId);
    if (!target) return;

    const updated = allocations.map((a) => {
      if (a.id === allocId) {
        return {
          ...a,
          day: newDay,
          period: newPeriod,
        };
      }
      return a;
    });

    syncAllocations(updated);
  };

  const handleToggleLock = (allocId: string) => {
    const updated = allocations.map((a) => {
      if (a.id === allocId) {
        return { ...a, isLocked: !a.isLocked };
      }
      return a;
    });
    syncAllocations(updated);
  };

  const handleDeleteAllocation = (allocId: string) => {
    const updated = allocations.filter((a) => a.id !== allocId);
    syncAllocations(updated);
  };

  const handleResetData = () => {
    setBatches(JSON.parse(JSON.stringify(INITIAL_DATASET.batches)));
    setFaculty(JSON.parse(JSON.stringify(INITIAL_DATASET.faculty)));
    setClassrooms(JSON.parse(JSON.stringify(INITIAL_DATASET.classrooms)));
    setSubjects(JSON.parse(JSON.stringify(INITIAL_DATASET.subjects)));
    setDemoNotice(null);

    fetch('/api/data/reset', { method: 'POST' })
      .then(() => handleGenerate())
      .catch(() => handleGenerate());
  };

  const handleExportICS = () => {
    const activeBatch = batches.find((b) => b.id === selectedBatchId);
    const activeFac = faculty.find((f) => f.id === selectedFacultyId);

    const icsContent = generateICS({
      allocations,
      subjects,
      faculty,
      classrooms,
      batches,
      filterBatchId: activeView === 'BATCH' ? selectedBatchId : undefined,
      filterFacultyId: activeView === 'FACULTY' ? selectedFacultyId : undefined,
      calendarName:
        activeView === 'BATCH'
          ? `ClassClockwork - ${activeBatch?.name || 'Batch Schedule'}`
          : `ClassClockwork - ${activeFac?.name || 'Faculty Schedule'}`,
    });

    const filename =
      activeView === 'BATCH'
        ? `timetable-${activeBatch?.code || 'batch'}.ics`
        : `timetable-${activeFac?.name.replace(/\s+/g, '_') || 'faculty'}.ics`;

    downloadICSFile(filename, icsContent);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        totalAllocations={allocations.length}
        clashes={clashes}
        giniCoefficient={giniCoefficient}
        preferenceSatisfaction={preferenceSatisfaction}
        isSolving={isSolving}
        onGenerate={handleGenerate}
        onTriggerDemoClash={handleTriggerDemoClash}
        onResetData={handleResetData}
        onExportICS={handleExportICS}
        onPrint={handlePrint}
        onOpenResourceManager={() => setIsResourceManagerOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        {/* Demo Notice Banner */}
        {demoNotice && (
          <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl flex items-center justify-between text-rose-200 text-xs shadow-md animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="font-semibold">{demoNotice}</span>
            </div>
            <button
              onClick={() => handleGenerate()}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
            >
              Resolve Conflict with CSP
            </button>
          </div>
        )}

        {/* Solver Benchmark Stats Badge */}
        {solverStats.lastGenerated && (
          <div className="mb-4 flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-indigo-300">
                <Zap className="w-3.5 h-3.5" />
                <span>MRV Backtracking Solved in <strong>{solverStats.executionTimeMs} ms</strong></span>
              </span>
              <span className="text-slate-500">•</span>
              <span>CSP Search Iterations: <strong className="text-slate-300 font-mono">{solverStats.iterations}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Batches: <strong className="text-slate-300">{batches.length}</strong> | Subjects: <strong className="text-slate-300">{subjects.length}</strong></span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Drag & drop any class block into another period to test live conflict detection</span>
            </div>
          </div>
        )}

        {/* Real-Time Clash Detection Auditor Panel */}
        <ClashAuditorPanel
          clashes={clashes}
          onAutoResolve={handleGenerate}
        />

        {/* View Mode & Entity Selector */}
        <ViewSelector
          activeView={activeView}
          onViewChange={setActiveView}
          batches={batches}
          faculty={faculty}
          classrooms={classrooms}
          selectedBatchId={selectedBatchId}
          onSelectBatch={setSelectedBatchId}
          selectedFacultyId={selectedFacultyId}
          onSelectFaculty={setSelectedFacultyId}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />

        {/* Interactive Weekly Timetable Grid Matrix */}
        <TimetableGrid
          allocations={allocations}
          batches={batches}
          faculty={faculty}
          classrooms={classrooms}
          subjects={subjects}
          clashes={clashes}
          activeView={activeView}
          selectedBatchId={selectedBatchId}
          selectedFacultyId={selectedFacultyId}
          selectedRoomId={selectedRoomId}
          lunchPeriod={solverConfig.respectLunchBreak ? solverConfig.lunchPeriod : -1}
          onMoveAllocation={handleMoveAllocation}
          onToggleLock={handleToggleLock}
          onDeleteAllocation={handleDeleteAllocation}
        />
      </main>

      {/* Printable Structured Schedule for PDF/Printer */}
      <PrintableTimetable
        batch={activeView === 'BATCH' ? batches.find((b) => b.id === selectedBatchId) : undefined}
        facultyMember={activeView === 'FACULTY' ? faculty.find((f) => f.id === selectedFacultyId) : undefined}
        allocations={allocations}
        subjects={subjects}
        faculty={faculty}
        classrooms={classrooms}
        lunchPeriod={solverConfig.respectLunchBreak ? solverConfig.lunchPeriod : -1}
      />

      {/* Resource Manager Modal */}
      <ResourceManager
        isOpen={isResourceManagerOpen}
        onClose={() => setIsResourceManagerOpen(false)}
        batches={batches}
        faculty={faculty}
        classrooms={classrooms}
        subjects={subjects}
        onSaveBatch={(batch) => {
          const idx = batches.findIndex((b) => b.id === batch.id);
          const next = idx >= 0 ? [...batches] : [...batches, batch];
          if (idx >= 0) next[idx] = batch;
          setBatches(next);
        }}
        onDeleteBatch={(id) => setBatches(batches.filter((b) => b.id !== id))}
        onSaveFaculty={(fac) => {
          const idx = faculty.findIndex((f) => f.id === fac.id);
          const next = idx >= 0 ? [...faculty] : [...faculty, fac];
          if (idx >= 0) next[idx] = fac;
          setFaculty(next);
        }}
        onDeleteFaculty={(id) => setFaculty(faculty.filter((f) => f.id !== id))}
        onSaveClassroom={(room) => {
          const idx = classrooms.findIndex((r) => r.id === room.id);
          const next = idx >= 0 ? [...classrooms] : [...classrooms, room];
          if (idx >= 0) next[idx] = room;
          setClassrooms(next);
        }}
        onDeleteClassroom={(id) => setClassrooms(classrooms.filter((r) => r.id !== id))}
        onSaveSubject={(sub) => {
          const idx = subjects.findIndex((s) => s.id === sub.id);
          const next = idx >= 0 ? [...subjects] : [...subjects, sub];
          if (idx >= 0) next[idx] = sub;
          setSubjects(next);
        }}
        onDeleteSubject={(id) => setSubjects(subjects.filter((s) => s.id !== id))}
      />

      {/* Workload Balance & Gini Analytics Modal */}
      <WorkloadAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        faculty={faculty}
        allocations={allocations}
        subjects={subjects}
      />

      {/* Solver Settings Modal */}
      <SolverSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={solverConfig}
        onSaveConfig={(newConfig) => {
          setSolverConfig(newConfig);
        }}
      />
    </div>
  );
};
export default App;
