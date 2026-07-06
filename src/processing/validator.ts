/**
 * Validator
 * Validate log entries and report issues
 */

import type { RawLogEntry, ValidationResult, ValidationIssue } from "../types/log-entry";

const EXPECTED_PHASES = [
  "Requirement Analysis",
  "Architecture",
  "Implementation", 
  "Testing",
  "Documentation",
  "Deployment",
];

/**
 * Validate a single entry
 */
function validateEntry(entry: RawLogEntry): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check empty prompt
  if (!entry.prompt || entry.prompt.trim() === "") {
    issues.push({
      level: "error",
      entry_id: entry.event_id,
      field: "prompt",
      message: "Prompt is empty",
    });
  }

  // Check empty outcome
  if (!entry.outcome || entry.outcome.trim() === "") {
    issues.push({
      level: "error",
      entry_id: entry.event_id,
      field: "outcome",
      message: "Outcome is empty",
    });
  }

  // Check empty artifacts - warning, not error
  if (!entry.artifacts || entry.artifacts.length === 0) {
    issues.push({
      level: "warning",
      entry_id: entry.event_id,
      field: "artifacts",
      message: "No artifacts listed",
    });
  }

  // Check very long prompt (might have forgotten to trim code)
  if (entry.prompt && entry.prompt.length > 2000) {
    issues.push({
      level: "warning",
      entry_id: entry.event_id,
      field: "prompt",
      message: `Prompt is very long (${entry.prompt.length} chars) - consider summarizing`,
    });
  }

  // Check no commit field
  if (!entry.commit || entry.commit.trim() === "") {
    issues.push({
      level: "warning",
      entry_id: entry.event_id,
      field: "commit",
      message: "No commit hash linked",
    });
  }

  // Check timestamp validity
  const timestamp = new Date(entry.timestamp);
  if (isNaN(timestamp.getTime())) {
    issues.push({
      level: "error",
      entry_id: entry.event_id,
      field: "timestamp",
      message: "Invalid timestamp format",
    });
  }

  return issues;
}

/**
 * Validate all entries and return aggregated result
 */
export function validateEntries(entries: RawLogEntry[]): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  let invalidCount = 0;

  // Check individual entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Check duplicate event_id
    if (seenIds.has(entry.event_id)) {
      warnings.push({
        level: "warning",
        entry_id: entry.event_id,
        field: "event_id",
        message: "Duplicate event_id",
      });
    }
    seenIds.add(entry.event_id);

    // Check timestamp order (compare with previous)
    if (i > 0) {
      const prevTime = new Date(entries[i - 1].timestamp).getTime();
      const currTime = new Date(entry.timestamp).getTime();
      if (currTime < prevTime) {
        warnings.push({
          level: "warning",
          entry_id: entry.event_id,
          field: "timestamp",
          message: "Timestamp is earlier than previous entry (out of order)",
        });
      }
    }

    // Validate entry fields
    const entryIssues = validateEntry(entry);
    for (const issue of entryIssues) {
      if (issue.level === "error") {
        errors.push(issue);
        invalidCount++;
      } else {
        warnings.push(issue);
      }
    }
  }

  // Global checks
  const uniqueAuthors = new Set(entries.map(e => e.author));
  if (uniqueAuthors.size === 1 && entries.length > 5) {
    warnings.push({
      level: "warning",
      entry_id: "global",
      field: "author",
      message: `All ${entries.length} entries are from 1 author only - is this a team project?`,
    });
  }

  // Check phase coverage
  const presentPhases = new Set(entries.map(e => e.phase));
  const missingPhases = EXPECTED_PHASES.filter(p => 
    !Array.from(presentPhases).some(ep => 
      ep.toLowerCase().includes(p.toLowerCase().split(" ")[0])
    )
  );

  if (missingPhases.length > 0) {
    warnings.push({
      level: "warning",
      entry_id: "global",
      field: "phase",
      message: `Missing common phases: ${missingPhases.join(", ")}`,
    });
  }

  // Check for planning/review entries
  const hasPlanningEntries = entries.some(e => 
    e.phase.toLowerCase().includes("brainstorm") ||
    e.phase.toLowerCase().includes("planning") ||
    e.action.toLowerCase().includes("plan")
  );

  if (!hasPlanningEntries && entries.length > 10) {
    warnings.push({
      level: "warning",
      entry_id: "global",
      field: "phase",
      message: "No brainstorm/planning phase entries found",
    });
  }

  const hasReviewEntries = entries.some(e => 
    e.phase.toLowerCase().includes("review") ||
    e.action.toLowerCase().includes("review")
  );

  if (!hasReviewEntries && entries.length > 10) {
    warnings.push({
      level: "warning",
      entry_id: "global",
      field: "phase",
      message: "No review phase entries found",
    });
  }

  // Calculate coverage score
  const phaseCoverage = (EXPECTED_PHASES.length - missingPhases.length) / EXPECTED_PHASES.length;
  const authorDiversity = Math.min(uniqueAuthors.size / 3, 1); // Cap at 3 authors
  const commitCoverage = entries.filter(e => e.commit).length / Math.max(entries.length, 1);
  
  const coverageScore = Math.round(
    (phaseCoverage * 0.4 + authorDiversity * 0.3 + commitCoverage * 0.3) * 100
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalEntries: entries.length,
      validEntries: entries.length - invalidCount,
      invalidEntries: invalidCount,
      coverageScore,
    },
  };
}
