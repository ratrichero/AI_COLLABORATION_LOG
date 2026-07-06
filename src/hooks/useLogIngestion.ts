/**
 * useLogIngestion Hook
 * Handles loading, parsing, and processing of JSONL log files
 */

import { useState, useCallback } from "react";
import type {
  ParsedLogFile,
  IngestionState,
  DataSource,
  ValidationResult,
} from "../types/log-entry";
import type { Overview, TimelineEvent, Task, Developer, Report } from "../types";
import { parseJsonlContent } from "../processing/parser";
import { mergeLogFiles } from "../processing/merger";
import { transformLogEntries } from "../processing/transformer";
import { validateEntries } from "../processing/validator";
import {
  exportMergedJsonl,
  exportCollaborationMarkdown,
  exportDashboardBundle,
  exportIndividualJsonFiles,
  exportFullEvidence,
} from "../processing/exporter";
import {
  readFileAsText,
  fetchTextContent,
  fetchGitHubDirectory,
  parseGitHubUrl,
} from "../utils/file-helpers";

export interface ProcessedData {
  overview: Overview;
  timeline: TimelineEvent[];
  tasks: Task[];
  developers: Developer[];
  report: Report;
}

export interface UseLogIngestionReturn {
  // State
  ingestion: IngestionState;
  validation: ValidationResult | null;
  processedData: ProcessedData | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadFiles: (files: File[]) => Promise<void>;
  loadFromGitHub: (repoUrl: string, branch: string, path: string) => Promise<void>;
  loadFromPaste: (content: string, label?: string) => void;
  clearAll: () => void;

  // Export
  exportJsonl: () => void;
  exportMarkdown: () => void;
  exportDashboardJson: () => void;
  exportIndividualFiles: () => void;
  exportAll: () => void;
}

const initialIngestionState: IngestionState = {
  files: [],
  allEntries: [],
  totalFiles: 0,
  totalEntries: 0,
  totalErrors: 0,
  loadedAt: "",
  sources: [],
};

export function useLogIngestion(): UseLogIngestionReturn {
  const [ingestion, setIngestion] = useState<IngestionState>(initialIngestionState);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process loaded files and update state
   */
  const processFiles = useCallback((
    newFiles: ParsedLogFile[],
    sources: DataSource[]
  ) => {
    // Merge with existing files
    const allFiles = [...ingestion.files, ...newFiles];
    
    // Merge all entries
    const mergeResult = mergeLogFiles(allFiles);
    
    // Validate
    const validationResult = validateEntries(mergeResult.entries);
    
    // Transform to dashboard data
    const transformed = transformLogEntries(mergeResult.entries);

    // Calculate totals
    const totalErrors = allFiles.reduce((sum, f) => sum + f.parseErrors.length, 0);

    // Update state
    setIngestion({
      files: allFiles,
      allEntries: mergeResult.entries,
      totalFiles: allFiles.length,
      totalEntries: mergeResult.entries.length,
      totalErrors,
      loadedAt: new Date().toISOString(),
      sources: [...ingestion.sources, ...sources],
    });

    setValidation(validationResult);
    setProcessedData(transformed);
    setError(null);
  }, [ingestion.files, ingestion.sources]);

  /**
   * Load files from File objects (drag & drop / file picker)
   */
  const loadFiles = useCallback(async (files: File[]) => {
    setLoading(true);
    setError(null);

    try {
      const parsedFiles: ParsedLogFile[] = [];
      const sources: DataSource[] = [];

      for (const file of files) {
        if (!file.name.endsWith(".jsonl") && !file.name.endsWith(".json")) {
          continue; // Skip non-JSON files
        }

        const content = await readFileAsText(file);
        const parsed = parseJsonlContent(content, file.name);
        parsedFiles.push(parsed);

        sources.push({
          type: "upload",
          label: file.name,
          entriesCount: parsed.entries.length,
          loadedAt: new Date().toISOString(),
        });
      }

      if (parsedFiles.length === 0) {
        throw new Error("No valid .jsonl or .json files found");
      }

      processFiles(parsedFiles, sources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [processFiles]);

  /**
   * Load from GitHub repository
   */
  const loadFromGitHub = useCallback(async (
    repoUrl: string,
    branch: string,
    path: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error("Invalid GitHub URL");
      }

      const { owner, repo } = parsed;
      
      // Fetch directory listing
      const files = await fetchGitHubDirectory(owner, repo, path, branch);
      
      // Filter for JSONL files
      const jsonlFiles = files.filter(
        f => f.type === "file" && (f.name.endsWith(".jsonl") || f.name.endsWith(".json"))
      );

      if (jsonlFiles.length === 0) {
        // Try to find subdirectories (evidence/author/log.jsonl pattern)
        const dirs = files.filter(f => f.type === "dir");
        
        for (const dir of dirs) {
          const subFiles = await fetchGitHubDirectory(owner, repo, dir.path, branch);
          const subJsonl = subFiles.filter(
            f => f.type === "file" && (f.name.endsWith(".jsonl") || f.name.endsWith(".json"))
          );
          jsonlFiles.push(...subJsonl);
        }
      }

      if (jsonlFiles.length === 0) {
        throw new Error("No .jsonl files found in the specified path");
      }

      const parsedFiles: ParsedLogFile[] = [];
      const sources: DataSource[] = [];

      for (const file of jsonlFiles) {
        if (!file.download_url) continue;

        const content = await fetchTextContent(file.download_url);
        const parsedFile = parseJsonlContent(content, file.path);
        parsedFiles.push(parsedFile);

        sources.push({
          type: "git-url",
          label: file.path,
          entriesCount: parsedFile.entries.length,
          loadedAt: new Date().toISOString(),
        });
      }

      if (parsedFiles.length === 0) {
        throw new Error("Failed to load any files from GitHub");
      }

      processFiles(parsedFiles, sources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load from GitHub");
    } finally {
      setLoading(false);
    }
  }, [processFiles]);

  /**
   * Load from pasted content
   */
  const loadFromPaste = useCallback((content: string, label: string = "pasted-content") => {
    setLoading(true);
    setError(null);

    try {
      const parsed = parseJsonlContent(content, label);
      
      if (parsed.entries.length === 0 && parsed.parseErrors.length > 0) {
        throw new Error(`Parse errors: ${parsed.parseErrors[0].error}`);
      }

      if (parsed.entries.length === 0) {
        throw new Error("No valid entries found in pasted content");
      }

      const sources: DataSource[] = [{
        type: "paste",
        label,
        entriesCount: parsed.entries.length,
        loadedAt: new Date().toISOString(),
      }];

      processFiles([parsed], sources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse pasted content");
    } finally {
      setLoading(false);
    }
  }, [processFiles]);

  /**
   * Clear all loaded data
   */
  const clearAll = useCallback(() => {
    setIngestion(initialIngestionState);
    setValidation(null);
    setProcessedData(null);
    setError(null);
  }, []);

  // Export functions
  const exportJsonl = useCallback(() => {
    if (ingestion.allEntries.length > 0) {
      exportMergedJsonl(ingestion.allEntries);
    }
  }, [ingestion.allEntries]);

  const exportMarkdown = useCallback(() => {
    if (processedData && ingestion.allEntries.length > 0) {
      exportCollaborationMarkdown(
        ingestion.allEntries,
        processedData.overview,
        processedData.tasks,
        processedData.developers
      );
    }
  }, [ingestion.allEntries, processedData]);

  const exportDashboardJson = useCallback(() => {
    if (processedData) {
      exportDashboardBundle(
        processedData.overview,
        processedData.timeline,
        processedData.tasks,
        processedData.developers,
        processedData.report
      );
    }
  }, [processedData]);

  const exportIndividualFiles = useCallback(() => {
    if (processedData) {
      exportIndividualJsonFiles(
        processedData.overview,
        processedData.timeline,
        processedData.tasks,
        processedData.developers,
        processedData.report
      );
    }
  }, [processedData]);

  const exportAll = useCallback(() => {
    if (processedData && ingestion.allEntries.length > 0) {
      exportFullEvidence(
        ingestion.files,
        ingestion.allEntries,
        processedData.overview,
        processedData.timeline,
        processedData.tasks,
        processedData.developers,
        processedData.report
      );
    }
  }, [ingestion.files, ingestion.allEntries, processedData]);

  return {
    ingestion,
    validation,
    processedData,
    loading,
    error,
    loadFiles,
    loadFromGitHub,
    loadFromPaste,
    clearAll,
    exportJsonl,
    exportMarkdown,
    exportDashboardJson,
    exportIndividualFiles,
    exportAll,
  };
}
