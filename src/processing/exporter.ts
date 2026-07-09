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

/** Escape pipe characters for markdown table cells */
function esc(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/** Format ISO timestamp to readable string */
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}

// ============================================================
//  SHARED: Generate the raw evidence appendix from RawLogEntry[]
// ============================================================

function generateRawEvidenceAppendix(entries: RawLogEntry[]): string[] {
  const lines: string[] = [];

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("# APPENDIX — Raw Evidence Logs");
  lines.push("");
  lines.push("> Below is the complete, unedited log of every AI interaction,");
  lines.push("> grouped by author and sorted chronologically within each group.");
  lines.push("> This section serves as verifiable evidence of the AI collaboration process.");
  lines.push("");
  lines.push(`> **Total entries:** ${entries.length}`);
  lines.push("");

  // Group entries by author
  const byAuthor = new Map<string, RawLogEntry[]>();
  for (const entry of entries) {
    const list = byAuthor.get(entry.author) || [];
    list.push(entry);
    byAuthor.set(entry.author, list);
  }

  // Sort authors alphabetically
  const sortedAuthors = Array.from(byAuthor.keys()).sort();

  for (const author of sortedAuthors) {
    const authorEntries = byAuthor.get(author)!;
    // Sort by timestamp within author
    authorEntries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    lines.push(`## ${author} (${authorEntries.length} entries)`);
    lines.push("");

    for (let i = 0; i < authorEntries.length; i++) {
      const e = authorEntries[i];

      lines.push(`### ${i + 1}. \`${e.event_id}\``);
      lines.push("");
      lines.push(`- **Timestamp:** ${fmtTime(e.timestamp)}`);
      lines.push(`- **Role:** ${e.role}`);
      lines.push(`- **Phase:** ${e.phase}`);
      lines.push(`- **Module:** ${e.module}`);
      lines.push(`- **Task:** ${e.task}`);
      lines.push(`- **Action:** ${e.action}`);
      if (e.tool) lines.push(`- **Tool:** ${e.tool}`);
      if (e.model) lines.push(`- **Model:** ${e.model}`);
      lines.push(`- **Decision:** ${e.decision}`);
      lines.push(`- **Status:** ${e.status}`);
      if (e.commit) lines.push(`- **Commit:** \`${e.commit}\``);
      lines.push("");

      lines.push("**Prompt:**");
      lines.push("");
      lines.push("```");
      lines.push(e.prompt);
      lines.push("```");
      lines.push("");

      lines.push("**Outcome:**");
      lines.push("");
      lines.push("```");
      lines.push(e.outcome);
      lines.push("```");
      lines.push("");

      if (e.artifacts.length > 0) {
        lines.push("**Artifacts:**");
        lines.push("");
        for (const a of e.artifacts) {
          lines.push(`- \`${a}\``);
        }
        lines.push("");
      }

      lines.push(`**Next Step:** ${e.next_step}`);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Merged timeline table at the very end for quick cross-reference
  lines.push("## Full Merged Timeline (all authors)");
  lines.push("");
  lines.push("| # | Timestamp | Author | Phase | Module | Task | Action | Decision | Status | Commit |");
  lines.push("|---|-----------|--------|-------|--------|------|--------|----------|--------|--------|");

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  sorted.forEach((e, idx) => {
    lines.push(
      `| ${idx + 1} | ${fmtTime(e.timestamp)} | ${e.author} | ${esc(e.phase)} | ${esc(e.module)} | ${esc(e.task)} | ${esc(e.action)} | ${e.decision} | ${e.status} | ${e.commit ? `\`${e.commit}\`` : "-"} |`
    );
  });
  lines.push("");

  return lines;
}

// ============================================================
//  Export merged entries as JSONL
// ============================================================

export function exportMergedJsonl(entries: RawLogEntry[]): void {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const content = sorted.map(e => JSON.stringify(e)).join("\n");
  downloadAsFile(content, "MERGED_LOG.jsonl", "application/jsonl");
}

// ============================================================
//  Export as AI Collaboration Log Markdown (imported data mode)
// ============================================================

export function exportCollaborationMarkdown(
  entries: RawLogEntry[],
  overview: Overview,
  tasks: Task[],
  developers: Developer[]
): void {
  const lines: string[] = [];

  // ── Header ──
  lines.push("# AI Collaboration Log");
  lines.push("");
  lines.push(`> **Project:** ${overview.project}`);
  lines.push(`> **Duration:** ${overview.duration}`);
  lines.push(`> **Contributors:** ${overview.members} members`);
  lines.push(`> **Generated:** ${new Date().toISOString()}`);
  lines.push("");

  // ── Summary ──
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Events:** ${overview.events}`);
  lines.push(`- **Total Tasks:** ${overview.tasks}`);
  lines.push(`- **Total Commits:** ${overview.commits}`);
  lines.push("");

  lines.push("### AI Providers Used");
  lines.push("");
  for (const [provider, count] of Object.entries(overview.providers)) {
    lines.push(`- ${provider}: ${count} events`);
  }
  lines.push("");

  // ── Event Timeline (summary table) ──
  lines.push("## Event Timeline");
  lines.push("");
  lines.push("| # | Time | Author | Phase | Module | Task | Action | Outcome | Decision |");
  lines.push("|---|------|--------|-------|--------|------|--------|---------|----------|");

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  sorted.forEach((entry, idx) => {
    const time = fmtTime(entry.timestamp);
    const outcome = esc(entry.outcome.substring(0, 60)) + (entry.outcome.length > 60 ? "..." : "");
    lines.push(
      `| ${idx + 1} | ${time} | ${entry.author} | ${esc(entry.phase)} | ${esc(entry.module)} | ${esc(entry.task)} | ${esc(entry.action)} | ${outcome} | ${entry.decision} |`
    );
  });
  lines.push("");

  // ── Per-Author Summary ──
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

  // ── Per-Task Summary ──
  lines.push("## Per-Task Summary");
  lines.push("");
  lines.push("| Task ID | Title | Status | Phase | Assignee | Events | Commits |");
  lines.push("|---------|-------|--------|-------|----------|--------|---------|");

  for (const task of tasks) {
    lines.push(
      `| ${esc(task.id)} | ${esc(task.title)} | ${task.status} | ${esc(task.phase)} | ${task.assignee} | ${task.events} | ${task.commits} |`
    );
  }
  lines.push("");

  // ── Per-Phase Summary ──
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

  // ── Decision Summary ──
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

  // ── RAW EVIDENCE APPENDIX ──
  lines.push(...generateRawEvidenceAppendix(entries));

  // ── RAW JSONL DUMP ──
  lines.push("## Merged Raw JSONL");
  lines.push("");
  lines.push(`> **${entries.length}** raw log entries, sorted chronologically.`);
  lines.push("> Each line is one complete JSON object as recorded during development.");
  lines.push("");
  lines.push("```jsonl");
  const chronological = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  for (const entry of chronological) {
    lines.push(JSON.stringify(entry));
  }
  lines.push("```");
  lines.push("");

  lines.push("---");
  lines.push("*Generated by ADTS Dashboard v2*");

  const content = lines.join("\n");
  downloadAsFile(content, "AI_COLLABORATION_LOG.md", "text/markdown");
}

// ============================================================
//  Export Dashboard JSON Bundle
// ============================================================

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

// ============================================================
//  Export individual JSON files (backward compatibility)
// ============================================================

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

// ============================================================
//  Compliance Report
// ============================================================

function generateComplianceReport(): string {
  return `# COMPLIANCE.md

## AI Collaboration Evidence

This directory contains the AI collaboration evidence for the hackathon submission.

### Contents

- \`MERGED_LOG.jsonl\` - Merged and sorted log entries from all team members
- \`AI_COLLABORATION_LOG.md\` - Human-readable collaboration log with full evidence appendix
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

// ============================================================
//  Export full evidence (multiple downloads)
// ============================================================

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

  // Export markdown (with raw evidence appendix)
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

// ============================================================
//  Export Report as Markdown (works for ALL data modes)
//  rawEntries is optional — when provided, each raw JSONL line
//  is appended at the very bottom as verifiable evidence.
// ============================================================

export function exportReportAsMarkdown(
  report: Report,
  timeline: TimelineEvent[],
  tasks: Task[],
  developers: Developer[],
  rawEntries: RawLogEntry[] = [],
): void {
  const lines: string[] = [];

  // ── Header ──
  lines.push("# AI Collaboration Log");
  lines.push("");
  lines.push(`> **Project:** ${report.project.name}`);
  lines.push(`> **Team:** ${report.project.team}`);
  lines.push(`> **Duration:** ${report.project.duration}`);
  lines.push(`> **Generated:** ${new Date(report.project.generated_at).toLocaleString("vi-VN")}`);
  lines.push("");

  // ── Summary ──
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

  // ── Phases ──
  lines.push("## Development Phases");
  lines.push("");
  lines.push("| # | Phase | Events | Summary |");
  lines.push("|---|-------|--------|---------|");
  report.phases.forEach((phase, idx) => {
    const summary = esc(phase.summary).substring(0, 80);
    lines.push(`| ${idx + 1} | ${esc(phase.name)} | ${phase.events} | ${summary} |`);
  });
  lines.push("");

  // ── Key Decisions ──
  lines.push("## Key Decisions");
  lines.push("");
  report.key_decisions.forEach((d, idx) => {
    lines.push(`### ${idx + 1}. ${d.title}`);
    lines.push("");
    lines.push(d.reason);
    lines.push("");
  });

  // ── Lessons Learned ──
  lines.push("## Lessons Learned");
  lines.push("");
  report.lessons_learned.forEach((l) => {
    lines.push(`- ${l}`);
  });
  lines.push("");

  // ── Metrics ──
  lines.push("## Metrics");
  lines.push("");
  lines.push(`- **Acceptance Rate:** ${fmtPct(report.metrics.acceptance_rate)}`);
  lines.push(`- **Average Response Time:** ${report.metrics.average_response_time}s`);
  lines.push(`- **Average Prompts per Task:** ${report.metrics.average_prompt_per_task}`);
  lines.push(`- **Generated Files:** ${report.metrics.generated_files}`);
  lines.push(`- **Unit Tests Generated:** ${report.metrics.unit_tests_generated}`);
  lines.push("");

  // ── Per-Task Detail ──
  if (tasks.length > 0) {
    lines.push("## Per-Task Summary");
    lines.push("");
    lines.push("| Task ID | Title | Status | Phase | Assignee | Events | Commits |");
    lines.push("|---------|-------|--------|-------|----------|--------|---------|");
    for (const task of tasks) {
      lines.push(
        `| ${esc(task.id)} | ${esc(task.title)} | ${task.status} | ${esc(task.phase)} | ${task.assignee} | ${task.events} | ${task.commits} |`
      );
    }
    lines.push("");

    for (const task of tasks) {
      if (task.summary) {
        lines.push(`### ${task.id} — ${task.title}`);
        lines.push("");
        lines.push(`- **Status:** ${task.status}  |  **Phase:** ${task.phase}  |  **Assignee:** ${task.assignee}`);
        lines.push(`- **Events:** ${task.events}  |  **Commits:** ${task.commits}`);
        lines.push("");
        lines.push(task.summary);
        lines.push("");
      }
    }
  }

  // ── Per-Developer Detail ──
  if (developers.length > 0) {
    lines.push("## Per-Developer Summary");
    lines.push("");
    for (const dev of developers) {
      lines.push(`### ${dev.name} (${dev.role})`);
      lines.push("");
      lines.push(`- **Events:** ${dev.events}  |  **Tasks:** ${dev.tasks}  |  **Commits:** ${dev.commits}`);
      lines.push("");

      if (Object.keys(dev.providers).length > 0) {
        lines.push("**Providers:**");
        for (const [p, c] of Object.entries(dev.providers)) {
          lines.push(`- ${p}: ${c}`);
        }
        lines.push("");
      }

      if (Object.keys(dev.phases).length > 0) {
        lines.push("**Phases:**");
        for (const [p, c] of Object.entries(dev.phases)) {
          lines.push(`- ${p}: ${c}`);
        }
        lines.push("");
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //  APPENDIX — Raw Evidence
  // ══════════════════════════════════════════════════════════
  lines.push("---");
  lines.push("");
  lines.push("# APPENDIX — Full Evidence");
  lines.push("");

  // Section A: Timeline table (always available from dashboard data)
  if (timeline.length > 0) {
    lines.push("## A. Event Timeline");
    lines.push("");
    lines.push("| # | Timestamp | Type | Member | Task | Title | Commit |");
    lines.push("|---|-----------|------|--------|------|-------|--------|");

    timeline.forEach((ev, idx) => {
      const time = fmtTime(ev.time);
      const title = esc(ev.title).substring(0, 70) + (ev.title.length > 70 ? "..." : "");
      const commit = ev.commit ? `\`${ev.commit}\`` : "-";
      lines.push(
        `| ${idx + 1} | ${time} | ${ev.type} | ${ev.member} | ${esc(ev.task)} | ${title} | ${commit} |`
      );
    });
    lines.push("");

    // Per-member breakdown
    const byMember = new Map<string, TimelineEvent[]>();
    for (const ev of timeline) {
      const list = byMember.get(ev.member) || [];
      list.push(ev);
      byMember.set(ev.member, list);
    }

    for (const member of Array.from(byMember.keys()).sort()) {
      const memberEvents = byMember.get(member)!;
      lines.push(`### ${member} — ${memberEvents.length} events`);
      lines.push("");
      memberEvents.forEach((ev, idx) => {
        lines.push(`${idx + 1}. **[${ev.type}]** ${fmtTime(ev.time)} — \`${ev.task}\` — ${ev.title}${ev.commit ? ` (commit: \`${ev.commit}\`)` : ""}`);
      });
      lines.push("");
    }
  }

  // Section B: Raw JSONL merge (the critical evidence)
  lines.push("## B. Merged Raw JSONL Evidence");
  lines.push("");

  if (rawEntries.length > 0) {
    lines.push(`> **${rawEntries.length}** raw log entries, sorted chronologically.`);
    lines.push("> Each line is one complete JSON object as recorded during development.");
    lines.push("");
    lines.push("```jsonl");

    const sorted = [...rawEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (const entry of sorted) {
      lines.push(JSON.stringify(entry));
    }

    lines.push("```");
  } else {
    lines.push("> Raw JSONL evidence is included when data is imported from .jsonl files.");
    lines.push("> Use the **Import** page to load log files, then export again for full evidence.");
  }
  lines.push("");

  lines.push("---");
  lines.push("*Generated by ADTS Dashboard v2*");

  const content = lines.join("\n");
  downloadAsFile(content, "AI_COLLABORATION_LOG.md", "text/markdown");
}
