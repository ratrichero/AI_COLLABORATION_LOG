import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Download,
  ArrowRight,
  Loader2,
  FolderOpen,
  FileJson,
  X,
} from "lucide-react";
import type { IngestionState, ValidationResult, ParsedLogFile } from "../types/log-entry";

interface ImportPageProps {
  ingestion: IngestionState;
  validation: ValidationResult | null;
  loading: boolean;
  error: string | null;
  onLoadFiles: (files: File[]) => Promise<void>;
  onLoadFromGitHub: (repoUrl: string, branch: string, path: string) => Promise<void>;
  onLoadFromPaste: (content: string) => void;
  onClearAll: () => void;
  onExportJsonl: () => void;
  onExportMarkdown: () => void;
  onExportDashboardJson: () => void;
  onExportAll: () => void;
  onNavigateToDashboard: () => void;
  hasData: boolean;
}

export default function ImportPage({
  ingestion,
  validation,
  loading,
  error,
  onLoadFiles,
  onLoadFromGitHub,
  onLoadFromPaste,
  onClearAll,
  onExportJsonl,
  onExportMarkdown,
  onExportDashboardJson,
  onExportAll,
  onNavigateToDashboard,
  hasData,
}: ImportPageProps) {
  const [gitUrl, setGitUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitPath, setGitPath] = useState("evidence");
  const [pasteContent, setPasteContent] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await onLoadFiles(files);
      }
    },
    [onLoadFiles]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await onLoadFiles(files);
      }
    },
    [onLoadFiles]
  );

  const handleGitHubLoad = useCallback(async () => {
    if (gitUrl.trim()) {
      await onLoadFromGitHub(gitUrl.trim(), gitBranch, gitPath);
    }
  }, [gitUrl, gitBranch, gitPath, onLoadFromGitHub]);

  const handlePaste = useCallback(() => {
    if (pasteContent.trim()) {
      onLoadFromPaste(pasteContent.trim());
      setPasteContent("");
    }
  }, [pasteContent, onLoadFromPaste]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Upload size={24} className="text-accent" />
            Import AI Collaboration Logs
          </h2>
          <p className="mt-1 text-sm text-muted">
            Load JSONL log files to visualize AI collaboration data
          </p>
        </div>
        {hasData && (
          <button
            onClick={onNavigateToDashboard}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-solid px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-solid-hover"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <p className="font-medium text-danger">Error</p>
            <p className="mt-1 text-sm text-danger/80">{error}</p>
          </div>
        </div>
      )}

      {/* Input Options Grid - Stack on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Option 1: File Upload */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FolderOpen size={18} className="text-accent" />
            Option 1: Upload Files
          </h3>
          <p className="mt-1 text-xs text-faint">
            Drag & drop or select .jsonl files
          </p>

          <div
            className={`mt-4 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-line hover:border-accent/50 hover:bg-panel/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {loading ? (
              <Loader2 size={32} className="animate-spin text-accent" />
            ) : (
              <>
                <FileJson size={32} className="text-faint" />
                <p className="mt-2 text-sm font-medium text-muted">
                  Drag & drop .jsonl files here
                </p>
                <p className="mt-1 text-xs text-faint">or click to browse</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jsonl,.json"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Option 2: GitHub Repository */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FolderOpen size={18} className="text-accent" />
            Option 2: Load from GitHub
          </h3>
          <p className="mt-1 text-xs text-faint">
            Fetch log files from a public repository
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted">
                Repository URL
              </label>
              <input
                type="text"
                value={gitUrl}
                onChange={(e) => setGitUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted">Branch</label>
                <input
                  type="text"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  placeholder="main"
                  className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Path</label>
                <input
                  type="text"
                  value={gitPath}
                  onChange={(e) => setGitPath(e.target.value)}
                  placeholder="evidence"
                  className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
                />
              </div>
            </div>
            <button
              onClick={handleGitHubLoad}
              disabled={loading || !gitUrl.trim()}
              className="w-full rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load from GitHub"
              )}
            </button>
          </div>
        </div>

        {/* Option 3: Paste Content */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ClipboardPaste size={18} className="text-accent" />
            Option 3: Paste JSONL Content
          </h3>
          <p className="mt-1 text-xs text-faint">
            Paste raw JSONL content directly
          </p>

          <div className="mt-4">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder='{"event_id":"001","timestamp":"2025-01-15T09:00:00Z",...}
{"event_id":"002","timestamp":"2025-01-15T09:15:00Z",...}'
              className="h-32 w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handlePaste}
                disabled={loading || !pasteContent.trim()}
                className="rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover disabled:opacity-50"
              >
                Parse Content
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loaded Data Summary */}
      {ingestion.totalFiles > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText size={18} className="text-accent" />
              Loaded Data Summary
            </h3>
            <div className="flex items-center gap-2">
              {validation && !validation.valid && (
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="inline-flex items-center gap-1 rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/20"
                >
                  <AlertTriangle size={14} />
                  {validation.errors.length} errors
                </button>
              )}
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-panel p-3 text-center">
              <p className="text-xl font-bold text-ink">{ingestion.totalFiles}</p>
              <p className="text-xs text-faint">Files</p>
            </div>
            <div className="rounded-lg bg-panel p-3 text-center">
              <p className="text-xl font-bold text-ink">{ingestion.totalEntries}</p>
              <p className="text-xs text-faint">Entries</p>
            </div>
            <div className="rounded-lg bg-panel p-3 text-center">
              <p className="text-xl font-bold text-ink">
                {validation?.stats.coverageScore || 0}%
              </p>
              <p className="text-xs text-faint">Coverage</p>
            </div>
            <div className="rounded-lg bg-panel p-3 text-center">
              <p className="text-xl font-bold text-ink">{ingestion.totalErrors}</p>
              <p className="text-xs text-faint">Parse Errors</p>
            </div>
          </div>

          {/* Files Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted">
                    Source
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted">
                    Author
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted">
                    Events
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ingestion.files.map((file: ParsedLogFile, idx: number) => (
                  <tr key={idx} className="border-b border-line/50">
                    <td className="px-3 py-2 font-mono text-xs text-ink">
                      {file.filename}
                    </td>
                    <td className="px-3 py-2 text-muted">{file.author}</td>
                    <td className="px-3 py-2 text-right text-ink">
                      {file.entries.length}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {file.parseErrors.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 size={14} />
                          valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-warning">
                          <AlertTriangle size={14} />
                          {file.parseErrors.length} err
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Errors */}
          {showErrors && validation && validation.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-medium text-danger">
                  <AlertCircle size={16} />
                  Validation Errors
                </h4>
                <button
                  onClick={() => setShowErrors(false)}
                  className="text-danger/60 hover:text-danger"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {validation.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx} className="text-danger/80">
                    <span className="font-mono">[{err.entry_id}]</span>{" "}
                    {err.field}: {err.message}
                  </li>
                ))}
                {validation.errors.length > 10 && (
                  <li className="text-danger/60">
                    ...and {validation.errors.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {validation && validation.warnings && validation.warnings.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs text-warning">
                  <AlertTriangle size={12} />
                  {validation.warnings.length} warnings
                </span>
              )}
            </div>
            <button
              onClick={onNavigateToDashboard}
              disabled={!hasData}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-solid px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-solid-hover disabled:opacity-50"
            >
              View Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Export Options */}
      {hasData && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Download size={18} className="text-accent" />
            Export Evidence Bundle
          </h3>
          <p className="mt-1 text-xs text-faint">
            Download processed data in various formats
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onExportJsonl}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-elevated"
            >
              <FileJson size={16} className="text-accent" />
              Export Merged JSONL
            </button>
            <button
              onClick={onExportMarkdown}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-elevated"
            >
              <FileText size={16} className="text-accent" />
              Export AI_COLLABORATION_LOG.md
            </button>
            <button
              onClick={onExportDashboardJson}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-elevated"
            >
              <Download size={16} className="text-accent" />
              Export Dashboard JSON Bundle
            </button>
            <button
              onClick={onExportAll}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover"
            >
              <Download size={16} />
              Export Full Evidence
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
