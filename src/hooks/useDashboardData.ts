/**
 * useDashboardData Hook
 * Main data hook for Dashboard - integrates with both static files and log ingestion
 */

import { useState, useEffect, useCallback } from "react";
import type { Overview, TimelineEvent, Task, Developer, Report, DashboardData } from "../types";
import type { IngestionState, ValidationResult, ExportFormat } from "../types/log-entry";
import { useLogIngestion } from "./useLogIngestion";

export interface UseDashboardDataReturn {
  // Core data
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refetch: () => void;

  // New v2 additions
  hasData: boolean;
  dataSource: "static" | "imported" | "none";
  ingestion: IngestionState;
  validation: ValidationResult | null;

  // Actions
  loadFiles: (files: File[]) => Promise<void>;
  loadFromGitHub: (repoUrl: string, branch: string, path: string) => Promise<void>;
  loadFromPaste: (content: string) => void;
  clearAll: () => void;
  exportData: (format: ExportFormat) => void;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export function useDashboardData(): UseDashboardDataReturn {
  const [staticData, setStaticData] = useState<DashboardData>({
    overview: null,
    timeline: [],
    tasks: [],
    developers: [],
    report: null,
  });
  const [staticLoading, setStaticLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"static" | "imported" | "none">("none");

  const {
    ingestion,
    validation,
    processedData,
    loading: importLoading,
    error: importError,
    loadFiles,
    loadFromGitHub,
    loadFromPaste,
    clearAll: clearImported,
    exportJsonl,
    exportMarkdown,
    exportDashboardJson,
    exportAll,
  } = useLogIngestion();

  /**
   * Try to fetch static JSON files (backward compatibility)
   */
  const fetchStaticData = useCallback(async () => {
    setStaticLoading(true);

    try {
      const [overview, timeline, tasks, developers, report] = await Promise.all([
        fetchJson<Overview>("/data/overview.json"),
        fetchJson<TimelineEvent[]>("/data/timeline.json"),
        fetchJson<Task[]>("/data/tasks.json"),
        fetchJson<Developer[]>("/data/developers.json"),
        fetchJson<Report>("/data/report.json"),
      ]);

      if (overview) {
        setStaticData({
          overview,
          timeline: timeline || [],
          tasks: tasks || [],
          developers: developers || [],
          report: report || null,
        });
        setDataSource("static");
      } else {
        // No static files found — this is normal when deployed as
        // a single-file build (e.g. Vercel). Silently fall through
        // to the Import page without showing an error.
        setDataSource("none");
      }
    } catch {
      // Network error while probing for static files.
      // Treat identically to "no files found".
      setDataSource("none");
    } finally {
      setStaticLoading(false);
    }
  }, []);

  // Try to load static data on mount
  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  // Update data source when imported data changes
  useEffect(() => {
    if (processedData) {
      setDataSource("imported");
    }
  }, [processedData]);

  /**
   * Get the active data (either imported or static)
   */
  const getActiveData = (): DashboardData => {
    if (dataSource === "imported" && processedData) {
      return {
        overview: processedData.overview,
        timeline: processedData.timeline,
        tasks: processedData.tasks,
        developers: processedData.developers,
        report: processedData.report,
      };
    }
    return staticData;
  };

  const data = getActiveData();
  const hasData = data.overview !== null;
  const loading = staticLoading || importLoading;
  // Only show errors from import operations. Static 404s are silently
  // handled by falling through to the Import page.
  const error = importError;

  /**
   * Clear all data and reset to initial state
   */
  const clearAll = useCallback(() => {
    clearImported();
    setDataSource(staticData.overview ? "static" : "none");
  }, [clearImported, staticData.overview]);

  /**
   * Export data in specified format
   */
  const exportData = useCallback((format: ExportFormat) => {
    switch (format) {
      case "jsonl":
        exportJsonl();
        break;
      case "markdown":
        exportMarkdown();
        break;
      case "json-bundle":
        exportDashboardJson();
        break;
      case "zip":
        exportAll();
        break;
    }
  }, [exportJsonl, exportMarkdown, exportDashboardJson, exportAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchStaticData,
    hasData,
    dataSource,
    ingestion,
    validation,
    loadFiles,
    loadFromGitHub,
    loadFromPaste,
    clearAll,
    exportData,
  };
}
