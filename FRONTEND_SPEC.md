# ADTS Dashboard - Frontend Specification
> Version: 2.0  
> Last Updated: 2025-01-15

---

## 1. Overview

ADTS Dashboard v2 là một **Read-only Viewer** với khả năng **Import JSONL log files** trực tiếp. Dashboard có thể:
- Đọc dữ liệu từ static JSON files (backward compatible)
- Import JSONL files từ file upload, GitHub, hoặc paste
- Transform raw log entries thành dashboard visualizations
- Export processed data ra nhiều formats

### 1.1 Design Principles
- **Read-only**: Không có mutation, chỉ fetch/import và display
- **File-based**: Đọc từ static JSON files hoặc imported JSONL
- **Processing Pipeline**: Parse → Merge → Validate → Transform → Display
- **Offline-capable**: Sau khi có data, có thể chạy offline
- **Theme-aware**: Hỗ trợ Light và Dev (terminal) theme
- **Responsive**: Hoạt động trên desktop và tablet

### 1.2 Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Inter (Light), JetBrains Mono (Dev) |

---

## 2. Project Structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component với ThemeProvider
├── index.css                # CSS variables + Tailwind
│
├── types/
│   ├── index.ts             # Dashboard display types
│   └── log-entry.ts         # Raw JSONL log entry types
│
├── hooks/
│   ├── useDashboardData.ts  # Main data hook (static + imported)
│   └── useLogIngestion.ts   # JSONL load + parse + process
│
├── processing/              # Log processing layer
│   ├── index.ts             # Barrel export
│   ├── parser.ts            # Parse JSONL → entries
│   ├── merger.ts            # Merge multiple files
│   ├── transformer.ts       # Entries → Dashboard types
│   ├── validator.ts         # Validate entries
│   └── exporter.ts          # Export to various formats
│
├── theme/
│   └── ThemeProvider.tsx    # Theme context + utilities
│
├── components/
│   ├── Sidebar.tsx          # Navigation (with Import badge)
│   └── ThemeToggle.tsx      # Light/Dev theme switcher
│
├── pages/
│   ├── Import.tsx           # NEW: Import/load data page
│   ├── Overview.tsx         # Dashboard overview + charts
│   ├── Timeline.tsx         # Chronological event list
│   ├── TaskExplorer.tsx     # Task browser + detail panel
│   ├── Developers.tsx       # Developer activity
│   └── Report.tsx           # AI Collaboration Report
│
└── utils/
    ├── cn.ts                # Tailwind class merge
    └── file-helpers.ts      # File/URL utilities

public/
└── data/                    # Optional static JSON files
    ├── overview.json
    ├── timeline.json
    ├── tasks.json
    ├── developers.json
    └── report.json
```

---

## 3. Data Types

### 3.1 Raw Log Entry (from JSONL files)

```typescript
interface RawLogEntry {
  event_id: string;
  timestamp: string;
  author: string;
  role: "lead" | "developer" | "reviewer" | "architect";
  phase: string;
  module: string;
  task: string;
  action: string;
  prompt: string;
  outcome: string;
  artifacts: string[];
  decision: "accepted" | "accepted_modified" | "rejected" | "deferred";
  status: "completed" | "in_progress" | "blocked" | "failed";
  next_step: string;
  // Optional
  tool?: string;
  model?: string;
  commit?: string;
}
```

### 3.2 Dashboard Display Types

```typescript
// Overview
interface Overview {
  project: string;
  started_at: string;
  duration: string;
  members: number;
  tasks: number;
  events: number;
  commits: number;
  providers: Record<string, number>;
}

// Timeline Event
interface TimelineEvent {
  time: string;
  type: "prompt" | "commit" | "decision";
  member: string;
  task: string;
  title: string;
  commit?: string | null;
}

// Task
interface Task {
  id: string;
  title: string;
  status: "Done" | "In Progress" | "Todo";
  phase: string;
  assignee: string;
  events: number;
  commits: number;
  summary: string;
}

// Developer
interface Developer {
  name: string;
  role: string;
  avatar: string;
  events: number;
  tasks: number;
  commits: number;
  providers: Record<string, number>;
  phases: Record<string, number>;
  activity: Array<{ date: string; events: number }>;
}

// Report
interface Report {
  project: { name, team, generated_at, duration };
  summary: { events, tasks, commits, providers };
  phases: Array<{ name, events, summary }>;
  lessons_learned: string[];
  key_decisions: Array<{ title, reason }>;
  metrics: {
    acceptance_rate: number;      // 0.0-1.0 or 0-100
    average_response_time: number;
    average_prompt_per_task: number;
    generated_files: number;
    unit_tests_generated: number;
  };
}
```

---

## 4. Data Flow

### 4.1 Dual Data Sources

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Sources                            │
├─────────────────────────┬───────────────────────────────────┤
│   STATIC (v1 compat)    │         IMPORTED (v2)             │
│                         │                                    │
│   /data/*.json          │   File Upload / GitHub / Paste    │
│         │               │              │                     │
│         ▼               │              ▼                     │
│    fetch()              │      useLogIngestion               │
│         │               │     ┌────────┴────────┐            │
│         │               │     │ parser.ts       │            │
│         │               │     │ merger.ts       │            │
│         │               │     │ validator.ts    │            │
│         │               │     │ transformer.ts  │            │
│         │               │     └────────┬────────┘            │
│         │               │              │                     │
│         └───────────────┴──────────────┘                     │
│                         │                                    │
│                         ▼                                    │
│               useDashboardData                               │
│                         │                                    │
│                         ▼                                    │
│                   Dashboard Pages                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Processing Pipeline

```
JSONL Content
     │
     ▼
┌─────────────┐
│   parser    │  → ParsedLogFile { entries[], parseErrors[] }
└─────────────┘
     │
     ▼
┌─────────────┐
│   merger    │  → sorted entries[], duplicates[], timeRange
└─────────────┘
     │
     ▼
┌─────────────┐
│  validator  │  → ValidationResult { errors[], warnings[], stats }
└─────────────┘
     │
     ▼
┌─────────────┐
│ transformer │  → { overview, timeline, tasks, developers, report }
└─────────────┘
     │
     ▼
  Dashboard UI
```

---

## 5. Processing Layer

### 5.1 Parser (`processing/parser.ts`)

```typescript
// Parse JSONL content into structured entries
function parseJsonlContent(content: string, filename: string): ParsedLogFile

// Validation:
// - Required fields check
// - Role validation (lead|developer|reviewer|architect)
// - Decision validation (accepted|accepted_modified|rejected|deferred)
// - Status validation (completed|in_progress|blocked|failed)
// - Timestamp format check
// - Artifacts array check
```

### 5.2 Merger (`processing/merger.ts`)

```typescript
// Merge multiple parsed files into sorted list
function mergeLogFiles(files: ParsedLogFile[]): MergeResult

// Features:
// - Combine all entries from multiple files
// - Sort by timestamp ascending
// - Detect duplicate event_ids
// - Calculate time range
```

### 5.3 Transformer (`processing/transformer.ts`)

```typescript
// Transform raw entries to dashboard display types
function transformLogEntries(entries: RawLogEntry[]): TransformResult

// Transformations:
// - generateOverview(): project stats, providers from model field
// - generateTimeline(): map action/phase to event type
// - generateTasks(): group by task, determine status
// - generateDevelopers(): aggregate per author
// - generateReport(): auto-generate from entries
```

### 5.4 Validator (`processing/validator.ts`)

```typescript
function validateEntries(entries: RawLogEntry[]): ValidationResult

// Errors (must fix):
// - Empty prompt/outcome
// - Invalid timestamp format

// Warnings (should fix):
// - No artifacts
// - Very long prompt (>2000 chars)
// - No commit hash
// - Duplicate event_id
// - Timestamp out of order
// - Single author only
// - Missing expected phases
// - No planning/review entries
```

### 5.5 Exporter (`processing/exporter.ts`)

```typescript
// Export formats:
exportMergedJsonl(entries)           // → MERGED_LOG.jsonl
exportCollaborationMarkdown(...)     // → AI_COLLABORATION_LOG.md
exportDashboardBundle(...)           // → dashboard-bundle.json
exportFullEvidence(...)              // → All files sequentially
```

---

## 6. Pages Specification

### 6.1 Import Page (NEW)

**Purpose**: Entry point for loading data into Dashboard.

**Input Options**:
1. **File Upload**: Drag & drop or browse .jsonl/.json files
2. **GitHub Repository**: Fetch from public repo via API
3. **Paste Content**: Direct JSONL paste

**Features**:
- Multi-file support
- Parse error display
- Validation summary with coverage score
- File-by-file status table
- Export options after import

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│  📥 Import AI Collaboration Logs                          │
│                                                           │
│  ┌───────────────────┐  ┌───────────────────┐            │
│  │  Upload Files     │  │  Load from GitHub │            │
│  │  [Drop Zone]      │  │  [URL/Branch/Path]│            │
│  └───────────────────┘  └───────────────────┘            │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Paste JSONL Content                                 │ │
│  │  [Textarea]                              [Parse]     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📊 Loaded Data Summary                              │ │
│  │  Files: 5  |  Entries: 127  |  Coverage: 85%        │ │
│  │                                                       │ │
│  │  [Files Table with status]                           │ │
│  │                                                       │ │
│  │  [View Errors] [Clear All] [→ Dashboard]             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  📤 Export Evidence Bundle                           │ │
│  │  [JSONL] [Markdown] [JSON Bundle] [Full Evidence]   │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Overview

Same as v1, but data can come from imported JSONL.

### 6.3 Timeline

Same as v1, filter by member/type instead of developer/phase.

### 6.4 Task Explorer

Same as v1, status badges (Done/In Progress/Todo).

### 6.5 Developers

Same as v1, with activity sparklines.

### 6.6 Report

**Changed**: Report is auto-generated from imported entries.
- No longer requires static report.json
- Generated by `generateReport()` in transformer

---

## 7. Hooks

### 7.1 useLogIngestion

```typescript
interface UseLogIngestionReturn {
  // State
  ingestion: IngestionState;      // files, entries, stats
  validation: ValidationResult;   // errors, warnings
  processedData: ProcessedData;   // transformed dashboard data
  loading: boolean;
  error: string | null;

  // Actions
  loadFiles: (files: File[]) => Promise<void>;
  loadFromGitHub: (url, branch, path) => Promise<void>;
  loadFromPaste: (content: string) => void;
  clearAll: () => void;

  // Export
  exportJsonl: () => void;
  exportMarkdown: () => void;
  exportDashboardJson: () => void;
  exportAll: () => void;
}
```

### 7.2 useDashboardData

```typescript
interface UseDashboardDataReturn {
  // Core data (from either source)
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refetch: () => void;

  // Source tracking
  hasData: boolean;
  dataSource: "static" | "imported" | "none";
  ingestion: IngestionState;
  validation: ValidationResult;

  // Actions (delegated to useLogIngestion)
  loadFiles, loadFromGitHub, loadFromPaste, clearAll, exportData
}
```

---

## 8. Sidebar Updates

```typescript
const NAV_ITEMS = [
  { id: "import",     icon: Upload,          label: "Import" },      // NEW
  { id: "overview",   icon: LayoutDashboard, label: "Overview" },
  { id: "timeline",   icon: Clock,           label: "Timeline" },
  { id: "tasks",      icon: FolderKanban,    label: "Tasks" },
  { id: "developers", icon: Users,           label: "Developers" },
  { id: "report",     icon: FileText,        label: "Report" },
];
```

**Badges**:
- Pulsing dot on Import when no data loaded
- Warning dot when has validation warnings

---

## 9. App Flow

```typescript
function App() {
  // On mount:
  // 1. Try fetch static /data/*.json
  // 2. If found → dataSource = "static", go to Overview
  // 3. If not found → dataSource = "none", stay on Import

  // After import:
  // 1. loadFiles/loadFromGitHub/loadFromPaste
  // 2. Parse → Merge → Validate → Transform
  // 3. dataSource = "imported"
  // 4. User clicks "Go to Dashboard" → Overview
}
```

---

## 10. Export Formats

| Format | File | Description |
|--------|------|-------------|
| JSONL | `MERGED_LOG.jsonl` | All entries merged and sorted |
| Markdown | `AI_COLLABORATION_LOG.md` | Human-readable report with tables |
| JSON Bundle | `dashboard-bundle.json` | All 5 dashboard JSON files in one |
| Full Evidence | Multiple files | JSONL + Markdown + Compliance + Bundle |

---

## 11. Backward Compatibility

Dashboard v2 maintains v1 compatibility:

1. **Static JSON files** still work
   - If `/data/overview.json` exists → load all 5 files → show Overview
   
2. **Same display types**
   - Overview, TimelineEvent, Task, Developer, Report unchanged
   
3. **Same pages**
   - All 5 dashboard pages work identically

**New additions**:
- Import page for loading JSONL
- Processing layer for transforming raw logs
- Export functionality

---

## 12. Theme System

Same as v1:
- Light theme (default fonts, violet/indigo colors)
- Dev theme (terminal style, JetBrains Mono, green accent)
- Default: Dev theme
- Persisted to localStorage

---

## 13. Build Output

```
dist/
└── index.html    # Single-file bundle (~740KB, ~211KB gzipped)
```

---

## 14. Development

```bash
npm install        # Install dependencies
npm run dev        # Dev server
npm run build      # Production build
npm run preview    # Preview production
```

---

## 15. Migration from v1

No migration needed. v2 is additive:

- **v1 users**: Continue using static `/data/*.json` files
- **v2 users**: Use Import page to load JSONL files directly

Both workflows produce identical dashboard visualizations.
