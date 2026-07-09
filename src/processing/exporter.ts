/**
 * Exporter
 * Export processed data in various formats
 */

import type { RawLogEntry, ParsedLogFile } from "../types/log-entry";
import type { Overview, TimelineEvent, Task, Developer, Report } from "../types";
import { downloadAsFile } from "../utils/file-helpers";

/** Format acceptance_rate robustly */
function fmtPct(value: number): string {
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

/**
 * Export merged entries as JSONL
 */
export function exportMergedJsonl(entries: RawLogEntry[]): void {
  // Sort by timestamp
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const content = sorted.map(e => JSON.stringify(e)).join("\n");
  downloadAsFile(content, "MERGED_LOG.jsonl", "application/jsonl");
}

/**
 * Export as AI Collaboration Log Markdown
 */
export function exportCollaborationMarkdown(
  entries: RawLogEntry[],
  overview: Overview,
  tasks: Task[],
  developers: Developer[]
): void {
  const lines: string[] = [];

  // Header
  lines.push("# AI Collaboration Log");
  lines.push("");
  lines.push(`> **Project:** ${overview.project}`);
  lines.push(`> **Duration:** ${overview.duration}`);
  lines.push(`> **Contributors:** ${overview.members} members`);
  lines.push(`> **Generated:** ${new Date().toISOString()}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Events:** ${overview.events}`);
  lines.push(`- **Total Tasks:** ${overview.tasks}`);
  lines.push(`- **Total Commits:** ${overview.commits}`);
  lines.push("");

  // Provider breakdown
  lines.push("### AI Providers Used");
  lines.push("");
  for (const [provider, count] of Object.entries(overview.providers)) {
    lines.push(`- ${provider}: ${count} events`);
  }
  lines.push("");

  // Timeline table
  lines.push("## Event Timeline");
  lines.push("");
  lines.push("| # | Time | Author | Phase | Module | Task | Action | Outcome | Decision |");
  lines.push("|---|------|--------|-------|--------|------|--------|---------|----------|");

  entries.forEach((entry, idx) => {
    const time = new Date(entry.timestamp).toLocaleString("vi-VN");
    const outcome = entry.outcome.substring(0, 50) + (entry.outcome.length > 50 ? "..." : "");
    lines.push(
      `| ${idx + 1} | ${time} | ${entry.author} | ${entry.phase} | ${entry.module} | ${entry.task} | ${entry.action} | ${outcome} | ${entry.decision} |`
    );
  });
  lines.push("");

  // Per-Author Summary
  lines.push("## Per-Author Summary");
  lines.push("");
  
  for (const dev of developers) {
    lines.push(`### ${dev.name} (${dev.role})`);
    lines.push("");
    lines.push(`- **Events:** ${dev.events}`);
    lines.push(`- **Tasks:** ${dev.tasks}`);
    lines.push(`- **Commits:** ${dev.commits}`);
    lines.push("");
    
    lines.push("**Phases:**");
    for (const [phase, count] of Object.entries(dev.phases)) {
      lines.push(`- ${phase}: ${count}`);
    }
    lines.push("");
  }

  // Per-Task Summary
  lines.push("## Per-Task Summary");
  lines.push("");
  lines.push("| Task ID | Title | Status | Phase | Assignee | Events | Commits |");
  lines.push("|---------|-------|--------|-------|----------|--------|---------|");
  
  for (const task of tasks) {
    lines.push(
      `| ${task.id} | ${task.title} | ${task.status} | ${task.phase} | ${task.assignee} | ${task.events} | ${task.commits} |`
    );
  }
  lines.push("");

  // Phase Summary
  lines.push("## Per-Phase Summary");
  lines.push("");
  
  const phaseGroups = new Map<string, RawLogEntry[]>();
  for (const entry of entries) {
    const existing = phaseGroups.get(entry.phase) || [];
    existing.push(entry);
    phaseGroups.set(entry.phase, existing);
  }

  phaseGroups.forEach((phaseEntries, phase) => {
    lines.push(`### ${phase}`);
    lines.push("");
    lines.push(`- **Events:** ${phaseEntries.length}`);
    lines.push(`- **Unique Tasks:** ${new Set(phaseEntries.map(e => e.task)).size}`);
    lines.push(`- **Contributors:** ${new Set(phaseEntries.map(e => e.author)).size}`);
    lines.push("");
  });

  // Decision Summary
  lines.push("## Decision Summary");
  lines.push("");
  
  const decisionCounts: Record<string, number> = {};
  for (const entry of entries) {
    decisionCounts[entry.decision] = (decisionCounts[entry.decision] || 0) + 1;
  }
  
  for (const [decision, count] of Object.entries(decisionCounts)) {
    const pct = ((count / entries.length) * 100).toFixed(1);
    lines.push(`- **${decision}:** ${count} (${pct}%)`);
  }
  lines.push("");

  const content = lines.join("\n");
  downloadAsFile(content, "AI_COLLABORATION_LOG.md", "text/markdown");
}

/**
 * Export Dashboard JSON Bundle
 */
export function exportDashboardBundle(
  overview: Overview,
  timeline: TimelineEvent[],
  tasks: Task[],
  developers: Developer[],
  report: Report
): void {
  const bundle = {
    overview,
    timeline,
    tasks,
    developers,
    report,
    _meta: {
      exported_at: new Date().toISOString(),
      version: "2.0",
    },
  };

  const content = JSON.stringify(bundle, null, 2);
  downloadAsFile(content, "dashboard-bundle.json", "application/json");
}

/**
 * Export individual JSON files (for backward compatibility)
 */
export function exportIndividualJsonFiles(
  overview: Overview,
  timeline: TimelineEvent[],
  tasks: Task[],
  developers: Developer[],
  report: Report
): void {
  downloadAsFile(JSON.stringify(overview, null, 2), "overview.json", "application/json");
  
  setTimeout(() => {
    downloadAsFile(JSON.stringify(timeline, null, 2), "timeline.json", "application/json");
  }, 100);
  
  setTimeout(() => {
    downloadAsFile(JSON.stringify(tasks, null, 2), "tasks.json", "application/json");
  }, 200);
  
  setTimeout(() => {
    downloadAsFile(JSON.stringify(developers, null, 2), "developers.json", "application/json");
  }, 300);
  
  setTimeout(() => {
    downloadAsFile(JSON.stringify(report, null, 2), "report.json", "application/json");
  }, 400);
}

/**
 * Generate compliance report markdown
 */
function generateComplianceReport(): string {
  return `# COMPLIANCE.md

## AI Collaboration Evidence

This directory contains the AI collaboration evidence for the hackathon submission.

### Contents

- \`MERGED_LOG.jsonl\` - Merged and sorted log entries from all team members
- \`AI_COLLABORATION_LOG.md\` - Human-readable collaboration log
- \`dashboard-data/\` - Dashboard-compatible JSON files

### Log Entry Schema

Each log entry follows the ADTS LogRule format:

\`\`\`json
{
  "event_id": "string",
  "timestamp": "ISO 8601",
  "author": "string",
  "role": "lead | developer | reviewer | architect",
  "phase": "string",
  "module": "string",
  "task": "string",
  "action": "string",
  "prompt": "string",
  "outcome": "string",
  "artifacts": ["string"],
  "decision": "accepted | accepted_modified | rejected | deferred",
  "status": "completed | in_progress | blocked | failed",
  "next_step": "string"
}
\`\`\`

### Verification

All entries can be verified by:
1. Checking commit hashes in the repository
2. Reviewing artifact file paths
3. Cross-referencing timestamps with git history

---
*Generated by ADTS Dashboard*
`;
}

/**
 * Export full evidence as individual files
 * Note: ZIP requires a library, so we export individual files instead
 */
export function exportFullEvidence(
  _rawFiles: ParsedLogFile[],
  mergedEntries: RawLogEntry[],
  overview: Overview,
  timeline: TimelineEvent[],
  tasks: Task[],
  developers: Developer[],
  report: Report
): void {
  // Export merged JSONL
  exportMergedJsonl(mergedEntries);

  // Export markdown
  setTimeout(() => {
    exportCollaborationMarkdown(mergedEntries, overview, tasks, developers);
  }, 200);

  // Export compliance
  setTimeout(() => {
    downloadAsFile(generateComplianceReport(), "COMPLIANCE.md", "text/markdown");
  }, 400);

   // Export dashboard bundle
  setTimeout(() => {
    exportDashboardBundle(overview, timeline, tasks, developers, report);
  }, 600);
}

/**
 * Export a Report object as Markdown.
 * Works even when there are no raw log entries (static data mode).
 */
export function exportReportAsMarkdown(report: Report): void {
  const lines: string[] = [];

  lines.push("# AI Collaboration Log");
  lines.push("");
  lines.push(`> **Project:** ${report.project.name}`);
  lines.push(`> **Team:** ${report.project.team}`);
  lines.push(`> **Duration:** ${report.project.duration}`);
  lines.push(`> **Generated:** ${new Date(report.project.generated_at).toLocaleString("vi-VN")}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Events:** ${report.summary.events}`);
  lines.push(`- **Total Tasks:** ${report.summary.tasks}`);
  lines.push(`- **Total Commits:** ${report.summary.commits}`);
  lines.push("");
  lines.push("### AI Providers");
  lines.push("");
  for (const [provider, count] of Object.entries(report.summary.providers)) {
    lines.push(`- ${provider}: ${count} events`);
  }
  lines.push("");

  // Phases
  lines.push("## Development Phases");
  lines.push("");
  lines.push("| # | Phase | Events | Summary |");
  lines.push("|---|-------|--------|---------|");
  report.phases.forEach((phase, idx) => {
    const summary = phase.summary.replace(/\|/g, "\\|").substring(0, 80);
    lines.push(`| ${idx + 1} | ${phase.name} | ${phase.events} | ${summary} |`);
  });
  lines.push("");

  // Key Decisions
  lines.push("## Key Decisions");
  lines.push("");
  report.key_decisions.forEach((d, idx) => {
    lines.push(`### ${idx + 1}. ${d.title}`);
    lines.push("");
    lines.push(d.reason);
    lines.push("");
  });

  // Lessons Learned
  lines.push("## Lessons Learned");
  lines.push("");
  report.lessons_learned.forEach((l) => {
    lines.push(`- ${l}`);
  });
  lines.push("");

  // Metrics
  lines.push("## Metrics");
  lines.push("");
  lines.push(`- **Acceptance Rate:** ${fmtPct(report.metrics.acceptance_rate)}`);
  lines.push(`- **Average Response Time:** ${report.metrics.average_response_time}s`);
  lines.push(`- **Average Prompts per Task:** ${report.metrics.average_prompt_per_task}`);
  lines.push(`- **Generated Files:** ${report.metrics.generated_files}`);
  lines.push(`- **Unit Tests Generated:** ${report.metrics.unit_tests_generated}`);
  lines.push("");

  lines.push("---");
  lines.push("*Generated by ADTS Dashboard*");

  const content = lines.join("\n");
  downloadAsFile(content, "AI_COLLABORATION_LOG.md", "text/markdown");
}
