/**
 * JSONL Parser
 * Parse raw JSONL text content into structured log entries
 */

import type { RawLogEntry, ParsedLogFile, ParseError } from "../types/log-entry";

// Required fields that each entry must have
const REQUIRED_FIELDS: (keyof RawLogEntry)[] = [
  "event_id",
  "timestamp",
  "author",
  "role",
  "phase",
  "module",
  "task",
  "action",
  "prompt",
  "outcome",
  "artifacts",
  "decision",
  "status",
  "next_step",
];

const VALID_ROLES = ["lead", "developer", "reviewer", "architect"];
const VALID_DECISIONS = ["accepted", "accepted_modified", "rejected", "deferred"];
const VALID_STATUSES = ["completed", "in_progress", "blocked", "failed"];

/**
 * Parse a single JSON line into a RawLogEntry
 * Returns null if parsing fails
 */
function parseJsonLine(
  line: string,
  lineNumber: number
): { entry: RawLogEntry | null; error: ParseError | null } {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return { entry: null, error: null };
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in parsed)) {
        return {
          entry: null,
          error: {
            line: lineNumber,
            raw: trimmed.substring(0, 100) + (trimmed.length > 100 ? "..." : ""),
            error: `Missing required field: ${field}`,
          },
        };
      }
    }

    // Validate role
    if (!VALID_ROLES.includes(parsed.role)) {
      return {
        entry: null,
        error: {
          line: lineNumber,
          raw: trimmed.substring(0, 100),
          error: `Invalid role: ${parsed.role}. Must be one of: ${VALID_ROLES.join(", ")}`,
        },
      };
    }

    // Validate decision
    if (!VALID_DECISIONS.includes(parsed.decision)) {
      return {
        entry: null,
        error: {
          line: lineNumber,
          raw: trimmed.substring(0, 100),
          error: `Invalid decision: ${parsed.decision}. Must be one of: ${VALID_DECISIONS.join(", ")}`,
        },
      };
    }

    // Validate status
    if (!VALID_STATUSES.includes(parsed.status)) {
      return {
        entry: null,
        error: {
          line: lineNumber,
          raw: trimmed.substring(0, 100),
          error: `Invalid status: ${parsed.status}. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
      };
    }

    // Validate artifacts is array
    if (!Array.isArray(parsed.artifacts)) {
      return {
        entry: null,
        error: {
          line: lineNumber,
          raw: trimmed.substring(0, 100),
          error: `artifacts must be an array`,
        },
      };
    }

    // Validate timestamp format (basic check)
    if (isNaN(Date.parse(parsed.timestamp))) {
      return {
        entry: null,
        error: {
          line: lineNumber,
          raw: trimmed.substring(0, 100),
          error: `Invalid timestamp format: ${parsed.timestamp}`,
        },
      };
    }

    return { entry: parsed as RawLogEntry, error: null };
  } catch (e) {
    return {
      entry: null,
      error: {
        line: lineNumber,
        raw: trimmed.substring(0, 100) + (trimmed.length > 100 ? "..." : ""),
        error: `JSON parse error: ${e instanceof Error ? e.message : "Unknown error"}`,
      },
    };
  }
}

/**
 * Infer author from filename or entries
 */
export function inferAuthor(filename: string, entries: RawLogEntry[]): string {
  // Try to extract from path: evidence/minh/log.jsonl -> minh
  const pathMatch = filename.match(/evidence\/([^\/]+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  // Try to extract from filename: minh-log.jsonl -> minh
  const fileMatch = filename.match(/^([a-zA-Z0-9_-]+)[-_]?log/i);
  if (fileMatch) {
    return fileMatch[1].toLowerCase();
  }

  // Fallback to most common author in entries
  if (entries.length > 0) {
    const authorCounts = entries.reduce((acc, e) => {
      acc[e.author] = (acc[e.author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAuthor = Object.entries(authorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topAuthor) {
      return topAuthor[0];
    }
  }

  return "unknown";
}

/**
 * Parse JSONL content into a ParsedLogFile
 */
export function parseJsonlContent(content: string, filename: string): ParsedLogFile {
  const lines = content.split("\n");
  const entries: RawLogEntry[] = [];
  const parseErrors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const { entry, error } = parseJsonLine(lines[i], i + 1);
    
    if (entry) {
      entries.push(entry);
    }
    if (error) {
      parseErrors.push(error);
    }
  }

  const author = inferAuthor(filename, entries);

  return {
    filename,
    author,
    entries,
    parseErrors,
  };
}

/**
 * Parse multiple JSONL files
 */
export function parseMultipleFiles(
  files: Array<{ name: string; content: string }>
): ParsedLogFile[] {
  return files.map((f) => parseJsonlContent(f.content, f.name));
}
