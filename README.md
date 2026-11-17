# 🕒 ClassClockwork: ZeroClash Sprint

> **Automated College Timetable Generator with Backtracking Constraint Satisfaction (CSP) and Real-Time Conflict Detection**

ClassClockwork is a high-performance web application engineered to solve the complex academic scheduling challenge faced by university administrators every semester. By formulating timetable generation as a **Constraint Satisfaction Problem (CSP)** with the **Minimum Remaining Values (MRV)** heuristic, ClassClockwork generates 100% clash-free, workload-balanced weekly schedules in milliseconds while supporting real-time drag-and-drop manual reallocations with an instant conflict auditor.

---

## 🌟 Key Features & Architectural Matrix

| Category | Feature | Status | Description |
| :--- | :--- | :---: | :--- |
| **Core (Must-Have)** | **Academic Resource Manager** | ✅ | Full CRUD for Subjects, Faculty (workload caps, unavailable hours), Classrooms (capacities, lab equipment), and Student Batches. |
| **Core (Must-Have)** | **Constraint Satisfaction Engine** | ✅ | Backtracking CSP solver with Minimum Remaining Values (MRV) and Degree heuristic. |
| **Core (Must-Have)** | **Interactive Timetable Grid** | ✅ | 5-day / 7-period matrix with HTML5 Drag-and-Drop, continuous macro-slots, and locked cells. |
| **Core (Must-Have)** | **Real-Time Clash Auditor** | ✅ | Scans grid continuously; flashes immediate red badges on double-bookings or capacity violations. |
| **Core (Must-Have)** | **Batch & Faculty View Toggle** | ✅ | Instant switching between Student Cohort schedule, Individual Faculty schedule, and Room Utilization. |
| **Core (Must-Have)** | **Timetable Export Utility** | ✅ | Structured PDF / Printable schedule with official college letterhead, course legend, and dean signature box. |
| **Stretch (Good-to-Have)** | **Lunch & Break Optimizer** | ✅ | Automatically enforces uniform, synchronized departmental lunch recess (Period 4: 12:00 PM – 1:00 PM). |
| **Stretch (Good-to-Have)** | **Workload Balance (Gini)** | ✅ | Computes the exact Gini coefficient ($G$) of weekly teaching hours to prevent faculty burnout. |
| **Stretch (Good-to-Have)** | **iCal / Google Calendar Exporter** | ✅ | Generates `.ics` calendar files with 15-week semester recurring rules for student and faculty imports. |
| **Stretch (Good-to-Have)** | **Soft-Constraint Weighting** | ✅ | Optimizes schedules against faculty morning vs. afternoon teaching slot preference weights. |
| **Demo Trigger** | **One-Click Clash Demo** | ✅ | Deliberately forces Dr. Sharma into Room 102 to demonstrate the auditor catching room & faculty conflicts. |

---

## 📐 Algorithm & Constraint Satisfaction Mechanics

### 1. Variables & Domains
- **Variables ($X$)**: Discrete scheduling units decomposed from course syllabi (1-hour theory lectures vs. 2-hour and 3-hour continuous laboratory macro-slots).
- **Domains ($D$)**: Quadruple tuple $\langle \text{Day}, \text{StartPeriod}, \text{Duration}, \text{RoomID} \rangle$.
- **Macro-Slot Continuous Allocation**: Continuous laboratory blocks (e.g., 3-hour Operating Systems Lab, 3-hour AI Lab) are scheduled as atomic blocks before single lecture slots are processed, preventing fragmented days.

### 2. Heuristics
- **Minimum Remaining Values (MRV)**: At each step, the solver selects the variable with the fewest remaining conflict-free domain values, pruning unviable search branches early.
- **Degree Heuristic**: Breaks ties by prioritizing variables with highest constraints (multi-period lab durations, specialized equipment requirements, and faculty with highest time restrictions).
- **Least Constraining Value (LCV) & Soft Preference Weighting**: Favors slots aligning with faculty morning/afternoon requests and evenly distributes courses across weekdays.

### 3. Hard Constraints Enforced
1. **No Faculty Double-Booking**: $\forall f, d, p: \sum \text{Allocations}(f, d, p) \le 1$.
2. **No Room Double-Booking**: $\forall r, d, p: \sum \text{Allocations}(r, d, p) \le 1$.
3. **No Batch Double-Booking**: $\forall b, d, p: \sum \text{Allocations}(b, d, p) \le 1$.
4. **Room Capacity Compliance**: $\text{RoomCapacity}(r) \ge \text{BatchSize}(b)$.
5. **Laboratory Equipment Matching**: $\text{RequiredEquipment}(s) \subseteq \text{RoomEquipment}(r)$ and $\text{RoomType}(r) = \text{LAB}$.
6. **Faculty Availability Compliance**: No classes during faculty's declared unavailable slots.
7. **Faculty Weekly Workload Limits**: Total hours $\le \text{MaxWeeklyHours}(f)$.
8. **Protected Departmental Recess**: Zero classes scheduled during Period 4 (Lunch).

### 4. Mathematical Faculty Workload Equity Metric (Gini Coefficient)
The application computes the mathematical Gini coefficient ($G$) across active faculty:
$$G = \frac{\sum_{i=1}^{n} \sum_{j=1}^{n} |x_i - x_j|}{2 \cdot n \cdot \sum_{i=1}^{n} x_i}$$
Where:
- $n$: Total number of active faculty members.
- $x_i$: Weekly teaching hours assigned to faculty member $i$.
- **Interpretation**: $0.00$ represents perfect workload balance across the faculty; values $> 0.25$ indicate workload disparity.

---

## 💻 Tech Stack

- **Frontend**: TypeScript, React 18, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend API**: Node.js, Express, TypeScript, TSX.
- **Constraint Solver**: Backtracking CSP Engine with MRV and Forward Checking.
- **Auditing & Serialization**: Real-time Clash Auditor, iCalendar (`.ics`) RFC 5545 generator, Print CSS stylesheet.

---

## 🚀 Getting Started

### Recommended Workspace
Set your active workspace to:
`C:\Users\Keerthana\.gemini\antigravity\scratch\classclockwork`

### Running the Application

1. **Install Dependencies** (Already installed):
   ```bash
   npm install
   ```

2. **Start Development Server** (Runs frontend and backend concurrently):
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:5173`
   - Express Backend: `http://localhost:3001`

3. **Or Run Frontend Solo / Production Preview**:
   ```bash
   npm run client     # Vite dev server
   npm run build      # Type check & build production assets
   npm run preview    # Preview compiled dist
   ```

---

## 🎬 How to Demo ClassClockwork

1. **Automated Generation**:
   - Click the **"⚡ Generate Timetable"** button.
   - Within **25 milliseconds**, the Backtracking CSP solver places all 43 class sessions across 3 batches, 10 faculty, and 6 classrooms with **0 Clashes**!
   - Observe confetti and solver benchmark metrics (`Solved in ~20 ms | 44 iterations | 0 Clashes | Gini: 0.32`).

2. **Intentional Conflict & Real-Time Clash Auditor**:
   - Click the **"💥 Trigger Demo Clash"** button.
   - The system instantly flashes a bold red warning card:
     > `Clash: Dr. Ramesh Sharma already booked in Room 102 (CS-4B) and Room 101 (CS-4A)`
     > `Clash: CS-4B has overlapping classes: "Web Technologies" and "Operating Systems"`
     > `Workload Exceeded: Dr. Ramesh Sharma assigned 13 hrs/week (Limit: 12 hrs)`
   - Click **"Auto-Resolve with CSP"** to instantly restore a conflict-free grid!

3. **Drag-and-Drop Adjustment**:
   - Drag any class card from Monday to Tuesday or another period.
   - Observe real-time validation immediately verifying if the new room or faculty has conflicts.

4. **Multi-Period Continuous Labs**:
   - In Batch CS-4A or CS-6 view, notice the **3-Hour Continuous Lab Blocks** (e.g., Operating Systems Lab, AI & GPU Computing Lab) spanning Periods 1–3 or Periods 5–7 without fragmenting or crossing lunch.

5. **Workload Balance Analytics**:
   - Click **"Gini Workload"** in the top navigation bar to open the analytics modal.
   - Review the Gini index formula, individual faculty capacity bars, and morning/afternoon preference fulfillment percentages.

6. **Exporting Timetables**:
   - Click **"iCal"** to download a `.ics` calendar file ready for import into Google Calendar or Apple Calendar.
   - Click **"Print / PDF"** to view the clean, high-contrast, official academic letterhead print layout.
