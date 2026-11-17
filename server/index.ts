import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATASET } from '../src/sampleData';
import { TimetableDataset, SolverConfig } from '../src/types';
import { TimetableCSPSolver } from '../src/solver';
import { auditTimetable } from '../src/validator';
import { generateICS } from '../src/icsExporter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'store.json');

// Ensure data folder exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Load or initialize dataset
function loadData(): TimetableDataset {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading data store, falling back to initial data:', err);
  }
  saveData(INITIAL_DATASET);
  return JSON.parse(JSON.stringify(INITIAL_DATASET));
}

function saveData(data: TimetableDataset) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data store:', err);
  }
}

let dataset: TimetableDataset = loadData();

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ClassClockwork ZeroClash API',
    version: '1.0.0',
  });
});

// 2. Get entire dataset
app.get('/api/data', (req, res) => {
  res.json(dataset);
});

// 3. Reset dataset to benchmark computer science semester scenario
app.post('/api/data/reset', (req, res) => {
  dataset = JSON.parse(JSON.stringify(INITIAL_DATASET));
  saveData(dataset);
  res.json({ message: 'Dataset successfully reset to CS Benchmark Scenario', dataset });
});

// 4. Save entire dataset
app.post('/api/data', (req, res) => {
  dataset = req.body;
  saveData(dataset);
  res.json({ message: 'Dataset updated successfully', dataset });
});

// 5. CSP Solver Endpoint (Core Feature)
app.post('/api/generate', (req, res) => {
  const config: Partial<SolverConfig> = req.body.config || {};
  const solver = new TimetableCSPSolver(
    dataset.batches,
    dataset.faculty,
    dataset.classrooms,
    dataset.subjects,
    config
  );

  const result = solver.solve();
  dataset.allocations = result.allocations;
  saveData(dataset);

  res.json({
    ...result,
    dataset,
  });
});

// 6. Real-time Clash Auditor Endpoint
app.post('/api/validate', (req, res) => {
  const allocations = req.body.allocations || dataset.allocations;
  const lunchPeriod = req.body.lunchPeriod ?? 4;

  const clashes = auditTimetable({
    batches: dataset.batches,
    faculty: dataset.faculty,
    classrooms: dataset.classrooms,
    subjects: dataset.subjects,
    allocations,
    lunchPeriod,
  });

  res.json({
    totalClashes: clashes.length,
    criticalClashes: clashes.filter((c) => c.severity === 'CRITICAL').length,
    warnings: clashes.filter((c) => c.severity === 'WARNING').length,
    clashes,
  });
});

// 7. Update Allocations (e.g. after manual drag-and-drop)
app.post('/api/allocations', (req, res) => {
  if (Array.isArray(req.body.allocations)) {
    dataset.allocations = req.body.allocations;
    saveData(dataset);
    res.json({ message: 'Allocations updated', count: dataset.allocations.length });
  } else {
    res.status(400).json({ error: 'allocations array required' });
  }
});

// 8. iCalendar .ics export endpoint
app.post('/api/export/ics', (req, res) => {
  const { batchId, facultyId, calendarName } = req.body;
  const icsString = generateICS({
    allocations: dataset.allocations,
    subjects: dataset.subjects,
    faculty: dataset.faculty,
    classrooms: dataset.classrooms,
    batches: dataset.batches,
    filterBatchId: batchId,
    filterFacultyId: facultyId,
    calendarName,
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="classclockwork-timetable.ics"');
  res.send(icsString);
});

// 9. Resource Management Endpoints
app.post('/api/faculty', (req, res) => {
  const newFaculty = req.body;
  const existingIdx = dataset.faculty.findIndex((f) => f.id === newFaculty.id);
  if (existingIdx >= 0) {
    dataset.faculty[existingIdx] = newFaculty;
  } else {
    dataset.faculty.push(newFaculty);
  }
  saveData(dataset);
  res.json({ faculty: dataset.faculty });
});

app.delete('/api/faculty/:id', (req, res) => {
  dataset.faculty = dataset.faculty.filter((f) => f.id !== req.params.id);
  saveData(dataset);
  res.json({ faculty: dataset.faculty });
});

app.post('/api/subjects', (req, res) => {
  const newSubject = req.body;
  const existingIdx = dataset.subjects.findIndex((s) => s.id === newSubject.id);
  if (existingIdx >= 0) {
    dataset.subjects[existingIdx] = newSubject;
  } else {
    dataset.subjects.push(newSubject);
  }
  saveData(dataset);
  res.json({ subjects: dataset.subjects });
});

app.delete('/api/subjects/:id', (req, res) => {
  dataset.subjects = dataset.subjects.filter((s) => s.id !== req.params.id);
  saveData(dataset);
  res.json({ subjects: dataset.subjects });
});

app.post('/api/classrooms', (req, res) => {
  const newRoom = req.body;
  const existingIdx = dataset.classrooms.findIndex((r) => r.id === newRoom.id);
  if (existingIdx >= 0) {
    dataset.classrooms[existingIdx] = newRoom;
  } else {
    dataset.classrooms.push(newRoom);
  }
  saveData(dataset);
  res.json({ classrooms: dataset.classrooms });
});

app.delete('/api/classrooms/:id', (req, res) => {
  dataset.classrooms = dataset.classrooms.filter((r) => r.id !== req.params.id);
  saveData(dataset);
  res.json({ classrooms: dataset.classrooms });
});

app.post('/api/batches', (req, res) => {
  const newBatch = req.body;
  const existingIdx = dataset.batches.findIndex((b) => b.id === newBatch.id);
  if (existingIdx >= 0) {
    dataset.batches[existingIdx] = newBatch;
  } else {
    dataset.batches.push(newBatch);
  }
  saveData(dataset);
  res.json({ batches: dataset.batches });
});

app.delete('/api/batches/:id', (req, res) => {
  dataset.batches = dataset.batches.filter((b) => b.id !== req.params.id);
  saveData(dataset);
  res.json({ batches: dataset.batches });
});

// Serve static client assets if built
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ClassClockwork API Server running on http://localhost:${PORT}`);
});
