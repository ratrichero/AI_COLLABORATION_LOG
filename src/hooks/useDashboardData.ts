/**
 * useDashboardData Hook
 * Main data hook — integrates static files and log ingestion.
 * All export functions work regardless of data source.
 */

import { useState, useEffect, useCallback } from "react";
import type { Overview, TimelineEvent, Task, Developer, Report, DashboardData } from "../types";
import type { IngestionState, ValidationResult, ExportFormat } from "../types/log-entry";
import { useLogIngestion } from "./useLogIngestion";
import {
  exportReportAsMarkdown,
  exportDashboardBundle,
  exportMergedJsonl,
  exportFullEvidence,
} from "../processing/exporter";
import { downloadAsFile } from "../utils/file-helpers";

export interface UseDashboardDataReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasData: boolean;
  dataSource: "static" | "imported" | "none";
  ingestion: IngestionState;
  validation: ValidationResult | null;
  loadFiles: (files: File[]) => Promise<void>;
  loadFromGitHub: (repoUrl: string, branch: string, path: string) => Promise<void>;
  loadFromPaste: (content: string) => void;
  clearAll: () => void;
  exportData: (format: ExportFormat) => void;
  exportReportMarkdown: () => void;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useDashboardData(): UseDashboardDataReturn {
  const [staticData, setStaticData] = useState<DashboardData>({
    overview: null, timeline: [], tasks: [], developers: [], report: null,
  });
  const [staticLoading, setStaticLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"static" | "imported" | "none">("none");

  const {
    ingestion, validation, processedData,
    loading: importLoading, error: importError,
    loadFiles, loadFromGitHub, loadFromPaste,
    clearAll: clearImported,
  } = useLogIngestion();

  // ── fetch static files on mount ──
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
        setDataSource("none");
      }
    } catch {
      setDataSource("none");
    } finally {
      setStaticLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaticData(); }, [fetchStaticData]);

  useEffect(() => {
    if (processedData) setDataSource("imported");
  }, [processedData]);

  // ── active data ──
  const data: DashboardData =
    dataSource === "imported" && processedData
      ? {
          overview: processedData.overview,
          timeline: processedData.timeline,
          tasks: processedData.tasks,
          developers: processedData.developers,
          report: processedData.report,
        }
      : staticData;

  const hasData = data.overview !== null;
  const loading = staticLoading || importLoading;
  const error = importError;

  const clearAll = useCallback(() => {
    clearImported();
    setDataSource(staticData.overview ? "static" : "none");
  }, [clearImported, staticData.overview]);

  // ===================================================================
  //  EXPORT — works for BOTH static and imported data
  // ===================================================================

  /** Has imported raw JSONL entries? */
  const hasRawEntries = ingestion.allEntries.length > 0;

  const doExportJsonl = useCallback(() => {
    if (hasRawEntries) {
      exportMergedJsonl(ingestion.allEntries);
    } else {
      // Static mode: no raw entries — export timeline as JSONL
      const content = data.timeline.map(e => JSON.stringify(e)).join("\n");
      downloadAsFile(content, "MERGED_LOG.jsonl", "application/jsonl");
    }
  }, [hasRawEntries, ingestion.allEntries, data.timeline]);

  const doExportMarkdown = useCallback(() => {
    if (hasRawEntries && processedData) {
      // Imported mode: full markdown with raw JSONL appendix is
      // handled by exportReportAsMarkdown (which receives rawEntries)
      exportReportAsMarkdown(
        processedData.report,
        processedData.timeline,
        processedData.tasks,
        processedData.developers,
        ingestion.allEntries,
      );
    } else if (data.report) {
      exportReportAsMarkdown(
        data.report,
        data.timeline,
        data.tasks,
        data.developers,
        [], // no raw entries in static mode
      );
    }
  }, [hasRawEntries, processedData, ingestion.allEntries, data]);

  const doExportDashboardJson = useCallback(() => {
    if (!data.overview || !data.report) return;
    exportDashboardBundle(
      data.overview, data.timeline, data.tasks, data.developers, data.report,
    );
  }, [data]);

  const doExportAll = useCallback(() => {
    if (hasRawEntries && processedData) {
      exportFullEvidence(
        ingestion.files, ingestion.allEntries,
        processedData.overview, processedData.timeline,
        processedData.tasks, processedData.developers, processedData.report,
      );
    } else {
      // Static mode: download everything we have sequentially
      doExportJsonl();
      setTimeout(() => doExportMarkdown(), 300);
      setTimeout(() => doExportDashboardJson(), 600);
    }
  }, [hasRawEntries, processedData, ingestion, doExportJsonl, doExportMarkdown, doExportDashboardJson]);

  const exportData = useCallback((format: ExportFormat) => {
    switch (format) {
      case "jsonl": doExportJsonl(); break;
      case "markdown": doExportMarkdown(); break;
      case "json-bundle": doExportDashboardJson(); break;
      case "zip": doExportAll(); break;
    }
  }, [doExportJsonl, doExportMarkdown, doExportDashboardJson, doExportAll]);

  // Report page Export MD button
  const exportReportMarkdown = doExportMarkdown;

  return {
    data, loading, error,
    refetch: fetchStaticData,
    hasData, dataSource, ingestion, validation,
    loadFiles, loadFromGitHub, loadFromPaste, clearAll,
    exportData, exportReportMarkdown,
  };
}
