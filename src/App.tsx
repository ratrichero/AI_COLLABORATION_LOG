import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Loader2, Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import Import from "./pages/Import";
import Overview from "./pages/Overview";
import Timeline from "./pages/Timeline";
import TaskExplorer from "./pages/TaskExplorer";
import Developers from "./pages/Developers";
import Report from "./pages/Report";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useDashboardData } from "./hooks/useDashboardData";
import type { PageId } from "./types";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState<PageId>("import");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    data,
    loading,
    error,
    refetch,
    hasData,
    dataSource,
    ingestion,
    validation,
    loadFiles,
    loadFromGitHub,
    loadFromPaste,
    clearAll,
    exportData,
    exportReportMarkdown,
  } = useDashboardData();

  // Auto-redirect based on data availability
  useEffect(() => {
    if (hasData && currentPage === "import" && dataSource === "static") {
      setCurrentPage("overview");
    }
  }, [hasData, currentPage, dataSource]);

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  // Navigate to dashboard after importing
  const handleNavigateToDashboard = () => {
    if (hasData) {
      setCurrentPage("overview");
    }
  };

  const renderPage = () => {
    if (currentPage === "import") {
      return (
        <Import
          ingestion={ingestion}
          validation={validation}
          loading={loading}
          error={error}
          onLoadFiles={loadFiles}
          onLoadFromGitHub={loadFromGitHub}
          onLoadFromPaste={loadFromPaste}
          onClearAll={clearAll}
          onExportJsonl={() => exportData("jsonl")}
          onExportMarkdown={() => exportData("markdown")}
          onExportDashboardJson={() => exportData("json-bundle")}
          onExportAll={() => exportData("zip")}
          onNavigateToDashboard={handleNavigateToDashboard}
          hasData={hasData}
        />
      );
    }

    if (loading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="mx-auto animate-spin text-accent" />
            <p className="mt-4 text-sm text-muted">Loading dashboard data...</p>
          </div>
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className="flex h-[60vh] items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center sm:p-8">
            <AlertCircle size={36} className="mx-auto text-warning sm:h-10 sm:w-10" />
            <h3 className="mt-4 text-lg font-semibold text-ink">No Data Available</h3>
            <p className="mt-2 text-sm text-muted">
              Import log files first or wait for static data to load.
            </p>
            <button
              onClick={() => setCurrentPage("import")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-solid px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-solid-hover"
            >
              Go to Import
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "overview":
        return data.overview ? <Overview data={data.overview} /> : null;
      case "timeline":
        return <Timeline data={data.timeline} />;
      case "tasks":
        return <TaskExplorer data={data.tasks} />;
      case "developers":
        return <Developers data={data.developers} />;
      case "report":
        return data.report ? (
          <Report data={data.report} onExportMarkdown={exportReportMarkdown} />
        ) : (
          <div className="flex h-[60vh] items-center justify-center px-4">
            <div className="max-w-md rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
              <AlertCircle size={36} className="mx-auto text-faint sm:h-10 sm:w-10" />
              <h3 className="mt-4 text-lg font-semibold text-ink">Report Not Available</h3>
              <p className="mt-2 text-sm text-muted">
                Import log files to auto-generate the AI Collaboration Report.
              </p>
            </div>
          </div>
        );
      default:
        return data.overview ? <Overview data={data.overview} /> : null;
    }
  };

  const hasWarnings = validation?.warnings && validation.warnings.length > 0;

  const pageTitle = {
    import: "Import Data",
    overview: "Overview",
    timeline: "Timeline",
    tasks: "Tasks",
    developers: "Developers",
    report: "Report",
  }[currentPage];

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-muted hover:bg-elevated"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-bold text-ink">{pageTitle}</h1>
        <ThemeToggle />
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px]">
            <Sidebar
              currentPage={currentPage}
              onNavigate={setCurrentPage}
              collapsed={false}
              onToggle={() => {}}
              hasData={hasData}
              hasWarnings={hasWarnings}
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-faint hover:bg-elevated hover:text-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          hasData={hasData}
          hasWarnings={hasWarnings}
        />
      </div>

      {/* Main content */}
      <main
        className={`min-h-screen transition-all duration-300 lg:ml-[260px] ${
          sidebarCollapsed ? "lg:ml-[68px]" : ""
        }`}
      >
        {/* Desktop Top bar */}
        <header className="sticky top-0 z-30 hidden border-b border-line bg-surface/70 px-8 py-4 backdrop-blur-xl lg:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-ink">{pageTitle}</h1>
              <p className="text-xs text-faint">
                ADTS v2 •{" "}
                {dataSource === "imported"
                  ? "Imported Data"
                  : dataSource === "static"
                  ? "Static Cache"
                  : "No Data"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {hasData && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  {ingestion.totalEntries > 0
                    ? `${ingestion.totalEntries} entries`
                    : "Connected"}
                </span>
              )}
              {dataSource === "static" && (
                <button
                  onClick={refetch}
                  className="rounded-lg p-2 text-faint transition-colors hover:bg-elevated hover:text-muted"
                  title="Refresh static data"
                >
                  <RefreshCw size={16} />
                </button>
              )}
              <span className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-muted">
                {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">{renderPage()}</div>

        {/* Footer */}
        <footer className="border-t border-line px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-1 text-[10px] text-faint sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <span>ADTS v2.0</span>
            <span>
              {dataSource === "imported"
                ? "Imported from JSONL"
                : "Dashboard reads cache files"}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
