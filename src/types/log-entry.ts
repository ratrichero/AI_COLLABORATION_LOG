/**
 * Raw log entry từ JSONL files
 * Format mà AI ghi theo LogRule.md
 */
export interface RawLogEntry {
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
  // Optional fields
  tool?: string;
  model?: string;
  commit?: string;
}

/**
 * Một file JSONL đã được parse
 */
export interface ParsedLogFile {
  filename: string;        // "evidence/minh/log.jsonl"
  author: string;          // "minh" (inferred from path or content)
  entries: RawLogEntry[];
  parseErrors: ParseError[];
}

export interface ParseError {
  line: number;
  raw: string;
  error: string;
}

/**
 * Trạng thái toàn bộ data đã load
 */
export interface IngestionState {
  files: ParsedLogFile[];
  allEntries: RawLogEntry[];    // merged + sorted by timestamp
  totalFiles: number;
  totalEntries: number;
  totalErrors: number;
  loadedAt: string;             // ISO timestamp
  sources: DataSource[];        // track nguồn data
}

export type DataSourceType = "upload" | "directory" | "git-url" | "paste";

export interface DataSource {
  type: DataSourceType;
  label: string;               // "evidence/minh/log.jsonl" or repo URL
  entriesCount: number;
  loadedAt: string;
}

/**
 * Validation types
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];     // phải sửa
  warnings: ValidationIssue[];   // nên sửa
  stats: {
    totalEntries: number;
    validEntries: number;
    invalidEntries: number;
    coverageScore: number;       // 0-100, dựa trên đủ phases không
  };
}

export interface ValidationIssue {
  level: "error" | "warning";
  entry_id: string;
  field: string;
  message: string;
}

/**
 * Export format types
 */
export type ExportFormat = "jsonl" | "markdown" | "json-bundle" | "zip";
