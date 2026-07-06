/**
 * Transformer
 * Convert RawLogEntry[] to Dashboard display types
 */

import type { RawLogEntry } from "../types/log-entry";
import type { Overview, TimelineEvent, Task, Developer, Report } from "../types";
import { groupEntriesBy, countByField, mostCommonValue } from "./merger";
import { formatDuration } from "../utils/file-helpers";

/**
 * Map model name to provider
 */
function modelToProvider(model?: string): string {
  if (!model) return "Unknown";
  
  const m = model.toLowerCase();
  if (m.includes("gpt") || m.includes("o1") || m.includes("openai")) return "OpenAI";
  if (m.includes("claude")) return "Claude";
  if (m.includes("gemini")) return "Google";
  if (m.includes("llama") || m.includes("mixtral")) return "Meta/Mistral";
  if (m.includes("deepseek")) return "DeepSeek";
  
  return "Other";
}

/**
 * Map action/phase to timeline event type
 */
function mapToEventType(action: string, phase: string): "prompt" | "commit" | "decision" {
  const a = action.toLowerCase();
  const p = phase.toLowerCase();
  
  if (a.includes("review") || a.includes("plan") || a.includes("design") || 
      p.includes("brainstorm") || p.includes("architecture")) {
    return "decision";
  }
  
  if (a.includes("commit") || a.includes("merge") || a.includes("push")) {
    return "commit";
  }
  
  return "prompt";
}

/**
 * Determine task status from entries
 */
function determineTaskStatus(entries: RawLogEntry[]): "Done" | "In Progress" | "Todo" {
  if (entries.length === 0) return "Todo";
  
  const lastEntry = entries[entries.length - 1];
  
  // Check if all completed
  const allCompleted = entries.every(e => e.status === "completed");
  if (allCompleted) return "Done";
  
  // Check if any in progress
  const anyInProgress = entries.some(e => e.status === "in_progress");
  if (anyInProgress) return "In Progress";
  
  // Check last entry status
  if (lastEntry.status === "completed") return "Done";
  if (lastEntry.status === "in_progress") return "In Progress";
  
  return "Todo";
}

// ===== Generate Overview =====
export function generateOverview(entries: RawLogEntry[], projectName?: string): Overview {
  if (entries.length === 0) {
    return {
      project: projectName || "ADTS Project",
      started_at: new Date().toISOString(),
      duration: "0m",
      members: 0,
      tasks: 0,
      events: 0,
      commits: 0,
      providers: {},
    };
  }

  // Sort by timestamp to get range
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const startTime = sorted[0].timestamp;
  const endTime = sorted[sorted.length - 1].timestamp;
  const duration = formatDuration(startTime, endTime);

  // Count unique values
  const uniqueAuthors = new Set(entries.map(e => e.author));
  const uniqueTasks = new Set(entries.map(e => e.task));
  const entriesWithCommit = entries.filter(e => e.commit && e.commit.trim() !== "");

  // Aggregate providers from model field
  const providerCounts: Record<string, number> = {};
  for (const entry of entries) {
    const provider = modelToProvider(entry.model);
    providerCounts[provider] = (providerCounts[provider] || 0) + 1;
  }

  return {
    project: projectName || "ADTS Project",
    started_at: startTime,
    duration,
    members: uniqueAuthors.size,
    tasks: uniqueTasks.size,
    events: entries.length,
    commits: entriesWithCommit.length,
    providers: providerCounts,
  };
}

// ===== Generate Timeline =====
export function generateTimeline(entries: RawLogEntry[]): TimelineEvent[] {
  // Sort by timestamp
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return sorted.map(entry => ({
    time: entry.timestamp,
    type: mapToEventType(entry.action, entry.phase),
    member: entry.author,
    task: entry.task,
    title: entry.outcome.length > 100 
      ? entry.outcome.substring(0, 100) + "..." 
      : entry.outcome,
    commit: entry.commit || null,
  }));
}

// ===== Generate Tasks =====
export function generateTasks(entries: RawLogEntry[]): Task[] {
  const taskGroups = groupEntriesBy(entries, "task");
  const tasks: Task[] = [];

  taskGroups.forEach((taskEntries, taskId) => {
    if (!taskId) return;

    // Sort entries by timestamp
    const sorted = [...taskEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstEntry = sorted[0];
    const lastEntry = sorted[sorted.length - 1];

    // Get most common phase and assignee
    const phase = mostCommonValue(taskEntries, "phase") || "Implementation";
    const assignee = mostCommonValue(taskEntries, "author") || "Unknown";

    // Count commits
    const commits = taskEntries.filter(e => e.commit && e.commit.trim() !== "").length;

    // Generate summary from last entry's outcome or combine outcomes
    let summary = lastEntry.outcome;
    if (summary.length > 200) {
      summary = summary.substring(0, 200) + "...";
    }

    tasks.push({
      id: taskId,
      title: firstEntry.action || taskId,
      status: determineTaskStatus(taskEntries),
      phase,
      assignee,
      events: taskEntries.length,
      commits,
      summary,
    });
  });

  // Sort by ID
  tasks.sort((a, b) => a.id.localeCompare(b.id));

  return tasks;
}

// ===== Generate Developers =====
export function generateDevelopers(entries: RawLogEntry[]): Developer[] {
  const authorGroups = groupEntriesBy(entries, "author");
  const developers: Developer[] = [];

  authorGroups.forEach((authorEntries, authorName) => {
    if (!authorName) return;

    // Get most common role
    const role = mostCommonValue(authorEntries, "role") || "developer";
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

    // Count unique tasks
    const uniqueTasks = new Set(authorEntries.map(e => e.task));

    // Count commits
    const commits = authorEntries.filter(e => e.commit && e.commit.trim() !== "").length;

    // Aggregate providers
    const providers: Record<string, number> = {};
    for (const entry of authorEntries) {
      const provider = modelToProvider(entry.model);
      providers[provider] = (providers[provider] || 0) + 1;
    }

    // Aggregate phases
    const phases = countByField(authorEntries, "phase");

    // Generate activity data (events per day)
    const dayGroups: Record<string, number> = {};
    for (const entry of authorEntries) {
      const day = entry.timestamp.split("T")[0];
      dayGroups[day] = (dayGroups[day] || 0) + 1;
    }
    
    const activity = Object.entries(dayGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7) // Last 7 days
      .map(([date, events]) => ({ date, events }));

    developers.push({
      name: authorName,
      role: roleDisplay,
      avatar: authorName.charAt(0).toUpperCase(),
      events: authorEntries.length,
      tasks: uniqueTasks.size,
      commits,
      providers,
      phases,
      activity,
    });
  });

  // Sort by event count descending
  developers.sort((a, b) => b.events - a.events);

  return developers;
}

// ===== Generate Report =====
export function generateReport(entries: RawLogEntry[], overview: Overview): Report {
  // Group entries by phase
  const phaseGroups = groupEntriesBy(entries, "phase");
  const phases: Report["phases"] = [];

  phaseGroups.forEach((phaseEntries, phaseName) => {
    if (!phaseName) return;

    // Generate summary from outcomes
    const uniqueOutcomes = new Set(phaseEntries.map(e => e.outcome));
    const summaryParts = Array.from(uniqueOutcomes).slice(0, 3);
    const summary = summaryParts.join(". ").substring(0, 200);

    phases.push({
      name: phaseName,
      events: phaseEntries.length,
      summary: summary || `Completed ${phaseEntries.length} events in ${phaseName} phase.`,
    });
  });

  // Sort phases by common order
  const phaseOrder = ["Requirement Analysis", "Architecture", "Implementation", "Testing", "Documentation", "Deployment"];
  phases.sort((a, b) => {
    const indexA = phaseOrder.indexOf(a.name);
    const indexB = phaseOrder.indexOf(b.name);
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Extract key decisions from architecture/planning entries
  const decisionEntries = entries.filter(
    e => e.phase.toLowerCase().includes("architecture") ||
         e.phase.toLowerCase().includes("brainstorm") ||
         e.action.toLowerCase().includes("plan") ||
         e.action.toLowerCase().includes("design")
  );

  const keyDecisions = decisionEntries.slice(0, 5).map(e => ({
    title: e.action,
    reason: e.outcome.substring(0, 150),
  }));

  // Extract lessons learned from reviews and rejections
  const lessonEntries = entries.filter(
    e => e.action.toLowerCase().includes("review") ||
         e.decision === "rejected" ||
         e.decision === "accepted_modified"
  );

  const lessonsLearned = lessonEntries
    .slice(0, 6)
    .map(e => e.outcome.substring(0, 100));

  // If no lessons, generate default
  if (lessonsLearned.length === 0) {
    lessonsLearned.push(
      "Collaboration giua team members giup tang hieu qua",
      "Review code thuong xuyen giam thieu bugs",
      "Document decision de team hieu context"
    );
  }

  // Calculate metrics
  const acceptedCount = entries.filter(e => 
    e.decision === "accepted" || e.decision === "accepted_modified"
  ).length;
  
  const acceptanceRate = entries.length > 0 ? acceptedCount / entries.length : 0;

  const uniqueTasks = new Set(entries.map(e => e.task));
  const avgPromptPerTask = uniqueTasks.size > 0 ? entries.length / uniqueTasks.size : 0;

  // Count unique artifacts
  const allArtifacts = new Set<string>();
  for (const entry of entries) {
    for (const artifact of entry.artifacts) {
      allArtifacts.add(artifact);
    }
  }

  // Count test files
  const testFiles = Array.from(allArtifacts).filter(
    a => a.includes("test") || a.includes("spec") || a.includes("_test") || a.includes(".test.")
  ).length;

  return {
    project: {
      name: overview.project,
      team: `Team (${overview.members} members)`,
      generated_at: new Date().toISOString(),
      duration: overview.duration,
    },
    summary: {
      events: overview.events,
      tasks: overview.tasks,
      commits: overview.commits,
      providers: overview.providers,
    },
    phases,
    lessons_learned: lessonsLearned,
    key_decisions: keyDecisions,
    metrics: {
      acceptance_rate: acceptanceRate,
      average_response_time: 0, // No data available
      average_prompt_per_task: Math.round(avgPromptPerTask * 100) / 100,
      generated_files: allArtifacts.size,
      unit_tests_generated: testFiles,
    },
  };
}

// ===== Generate All Dashboard Data =====
export interface TransformResult {
  overview: Overview;
  timeline: TimelineEvent[];
  tasks: Task[];
  developers: Developer[];
  report: Report;
}

export function transformLogEntries(
  entries: RawLogEntry[],
  projectName?: string
): TransformResult {
  const overview = generateOverview(entries, projectName);
  const timeline = generateTimeline(entries);
  const tasks = generateTasks(entries);
  const developers = generateDevelopers(entries);
  const report = generateReport(entries, overview);

  return {
    overview,
    timeline,
    tasks,
    developers,
    report,
  };
}
