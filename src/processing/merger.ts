/**
 * Log Merger
 * Merge multiple parsed log files into a single sorted list
 */

import type { RawLogEntry, ParsedLogFile } from "../types/log-entry";

export interface MergeResult {
  entries: RawLogEntry[];
  duplicates: string[];      // duplicate event_ids
  timeRange: { start: string; end: string } | null;
}

/**
 * Merge multiple ParsedLogFile into a sorted list
 */
export function mergeLogFiles(files: ParsedLogFile[]): MergeResult {
  const allEntries: RawLogEntry[] = [];
  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  // Collect all entries
  for (const file of files) {
    for (const entry of file.entries) {
      if (seenIds.has(entry.event_id)) {
        duplicates.push(entry.event_id);
      } else {
        seenIds.add(entry.event_id);
        allEntries.push(entry);
      }
    }
  }

  // Sort by timestamp ascending
  allEntries.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // Calculate time range
  let timeRange: { start: string; end: string } | null = null;
  if (allEntries.length > 0) {
    timeRange = {
      start: allEntries[0].timestamp,
      end: allEntries[allEntries.length - 1].timestamp,
    };
  }

  return {
    entries: allEntries,
    duplicates,
    timeRange,
  };
}

/**
 * Group entries by a field
 */
export function groupEntriesBy<K extends keyof RawLogEntry>(
  entries: RawLogEntry[],
  field: K
): Map<RawLogEntry[K], RawLogEntry[]> {
  const groups = new Map<RawLogEntry[K], RawLogEntry[]>();

  for (const entry of entries) {
    const key = entry[field];
    const existing = groups.get(key) || [];
    existing.push(entry);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Count occurrences of a field value
 */
export function countByField<K extends keyof RawLogEntry>(
  entries: RawLogEntry[],
  field: K
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    const key = String(entry[field]);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Get unique values for a field
 */
export function uniqueValues<K extends keyof RawLogEntry>(
  entries: RawLogEntry[],
  field: K
): RawLogEntry[K][] {
  const values = new Set<RawLogEntry[K]>();
  for (const entry of entries) {
    values.add(entry[field]);
  }
  return Array.from(values);
}

/**
 * Get the most common value for a field
 */
export function mostCommonValue<K extends keyof RawLogEntry>(
  entries: RawLogEntry[],
  field: K
): RawLogEntry[K] | undefined {
  const counts = countByField(entries, field);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] as RawLogEntry[K] | undefined;
}
