import { useState, useMemo } from "react";
import {
  FolderKanban,
  User,
  Activity,
  GitCommit,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Filter,
  X,
  Layers,
  ArrowLeft,
} from "lucide-react";
import type { Task } from "../types";

interface TaskExplorerProps {
  data: Task[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; cls: string }> = {
  Done: { icon: <CheckCircle2 size={12} />, cls: "bg-success/10 text-success" },
  "In Progress": { icon: <Clock size={12} />, cls: "bg-info/10 text-info" },
  Todo: { icon: <Circle size={12} />, cls: "bg-panel text-faint" },
};

const PHASE_COLORS: Record<string, string> = {
  "Requirement Analysis": "#f59e0b",
  Architecture: "#6366f1",
  Implementation: "#10b981",
  Testing: "#3b82f6",
  Documentation: "#8b5cf6",
  Deployment: "#ef4444",
};

export default function TaskExplorer({ data }: TaskExplorerProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"id" | "events" | "commits">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  // Extract unique values for filters
  const { statuses, phases, assignees } = useMemo(() => {
    return {
      statuses: Array.from(new Set(data.map((t) => t.status))).sort(),
      phases: Array.from(new Set(data.map((t) => t.phase))).sort(),
      assignees: Array.from(new Set(data.map((t) => t.assignee))).sort(),
    };
  }, [data]);

  // Filter and sort data
  const filtered = useMemo(() => {
    let result = data.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPhase !== "all" && t.phase !== filterPhase) return false;
      if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
      );
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "id") cmp = a.id.localeCompare(b.id);
      else if (sortBy === "events") cmp = a.events - b.events;
      else if (sortBy === "commits") cmp = a.commits - b.commits;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [data, filterStatus, filterPhase, filterAssignee, searchQuery, sortBy, sortOrder]);

  const selected = data.find((t) => t.id === selectedTask);

  // Count active filters
  const activeFilterCount = [
    filterStatus !== "all",
    filterPhase !== "all",
    filterAssignee !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterPhase("all");
    setFilterAssignee("all");
    setSearchQuery("");
  };

  // Handle task selection (switch to detail view on mobile)
  const handleSelectTask = (taskId: string) => {
    setSelectedTask(taskId);
    if (window.innerWidth < 1024) {
      setViewMode("detail");
    }
  };

  // Back to list on mobile
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedTask(null);
  };

  // Stats summary
  const stats = useMemo(() => {
    const done = filtered.filter((t) => t.status === "Done").length;
    const inProgress = filtered.filter((t) => t.status === "In Progress").length;
    const todo = filtered.filter((t) => t.status === "Todo").length;
    const totalEvents = filtered.reduce((sum, t) => sum + t.events, 0);
    const totalCommits = filtered.reduce((sum, t) => sum + t.commits, 0);
    return { done, inProgress, todo, totalEvents, totalCommits };
  }, [filtered]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">Task Explorer</h2>
          <p className="mt-1 text-sm text-muted">
            Browse tasks and their AI collaboration history
          </p>
        </div>
      </div>

      {/* Quick Stats - Mobile friendly */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        <div className="rounded-xl bg-success/10 p-2 text-center sm:p-3">
          <p className="text-lg font-bold text-success sm:text-xl">{stats.done}</p>
          <p className="text-[10px] text-success/80 sm:text-xs">Done</p>
        </div>
        <div className="rounded-xl bg-info/10 p-2 text-center sm:p-3">
          <p className="text-lg font-bold text-info sm:text-xl">{stats.inProgress}</p>
          <p className="text-[10px] text-info/80 sm:text-xs">In Progress</p>
        </div>
        <div className="rounded-xl bg-panel p-2 text-center sm:p-3">
          <p className="text-lg font-bold text-muted sm:text-xl">{stats.todo}</p>
          <p className="text-[10px] text-faint sm:text-xs">Todo</p>
        </div>
        <div className="hidden rounded-xl bg-accent-soft p-3 text-center sm:block">
          <p className="text-xl font-bold text-accent">{stats.totalEvents}</p>
          <p className="text-xs text-accent/80">Events</p>
        </div>
        <div className="hidden rounded-xl bg-panel p-3 text-center sm:block">
          <p className="text-xl font-bold text-ink">{stats.totalCommits}</p>
          <p className="text-xs text-faint">Commits</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-all placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-accent bg-accent-soft text-accent"
              : "border-line bg-surface text-muted hover:bg-elevated"
          }`}
        >
          <Filter size={16} />
          <span className="hidden xs:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">Filter & Sort</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="text-xs text-accent hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Status Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <CheckCircle2 size={12} />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Phase Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <Layers size={12} />
                Phase
              </label>
              <select
                value={filterPhase}
                onChange={(e) => setFilterPhase(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {phases.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <User size={12} />
                Assignee
              </label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <Activity size={12} />
                Sort by
              </label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "id" | "events" | "commits")}
                  className="flex-1 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="id">ID</option>
                  <option value="events">Events</option>
                  <option value="commits">Commits</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="rounded-lg border border-line bg-panel px-2 py-1.5 text-muted hover:bg-elevated"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count & filter tags */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-faint">
          Showing <span className="font-medium text-ink">{filtered.length}</span> of {data.length} tasks
        </p>
        <div className="flex flex-wrap gap-1.5">
          {filterStatus !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              {filterStatus}
              <button onClick={() => setFilterStatus("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
          {filterPhase !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              {filterPhase}
              <button onClick={() => setFilterPhase("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
          {filterAssignee !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              {filterAssignee}
              <button onClick={() => setFilterAssignee("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        {/* Task List - Hidden on mobile when detail is shown */}
        <div className={`space-y-2 lg:col-span-2 ${viewMode === "detail" ? "hidden lg:block" : ""}`}>
          {filtered.length > 0 ? (
            filtered.map((task) => {
              const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.Todo;
              const phaseColor = PHASE_COLORS[task.phase] || "#8b5cf6";
              const isSelected = selectedTask === task.id;

              return (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task.id)}
                  className={`group w-full rounded-xl border p-3 text-left transition-all sm:rounded-2xl sm:p-4 ${
                    isSelected
                      ? "border-accent/50 bg-accent-soft/50 shadow-md"
                      : "border-line bg-surface shadow-sm hover:border-line-strong hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-panel px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted sm:px-2 sm:text-[10px]">
                          {task.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:gap-1 sm:px-2 sm:text-[10px] ${status.cls}`}
                        >
                          {status.icon}
                          <span className="hidden xs:inline">{task.status}</span>
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:text-[10px]"
                          style={{ backgroundColor: phaseColor + "20", color: phaseColor }}
                        >
                          {task.phase}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="mt-1.5 truncate text-sm font-medium text-ink">
                        {task.title}
                      </p>

                      {/* Meta */}
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-faint sm:gap-3 sm:text-xs">
                        <span className="flex items-center gap-1">
                          <User size={10} className="sm:h-3 sm:w-3" />
                          {task.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={10} className="sm:h-3 sm:w-3" />
                          {task.events}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitCommit size={10} className="sm:h-3 sm:w-3" />
                          {task.commits}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`shrink-0 transition-colors ${isSelected ? "text-accent" : "text-faint"}`}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-line bg-panel/50">
              <div className="text-center">
                <FolderKanban size={24} className="mx-auto text-faint" />
                <p className="mt-2 text-sm text-faint">No tasks found</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="mt-1 text-xs text-accent hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Task Detail - Full width on mobile */}
        <div className={`lg:col-span-3 ${viewMode === "list" ? "hidden lg:block" : ""}`}>
          {selected ? (
            <div className="sticky top-6 space-y-4 rounded-xl border border-line bg-surface p-4 shadow-sm sm:space-y-5 sm:rounded-2xl sm:p-6">
              {/* Back button (mobile only) */}
              <button
                onClick={handleBackToList}
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline lg:hidden"
              >
                <ArrowLeft size={16} />
                Back to list
              </button>

              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FolderKanban size={18} className="text-accent" />
                  <span className="rounded-md bg-panel px-2 py-0.5 font-mono text-xs font-bold text-muted">
                    {selected.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      STATUS_CONFIG[selected.status]?.cls
                    }`}
                  >
                    {STATUS_CONFIG[selected.status]?.icon}
                    {selected.status}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: (PHASE_COLORS[selected.phase] || "#8b5cf6") + "20",
                      color: PHASE_COLORS[selected.phase] || "#8b5cf6",
                    }}
                  >
                    {selected.phase}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-ink">{selected.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <User size={14} />
                  {selected.assignee}
                </p>
              </div>

              {/* Summary */}
              {selected.summary && (
                <div className="rounded-xl bg-accent-soft p-3 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                    Summary
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{selected.summary}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl bg-panel p-3">
                  <p className="text-[10px] font-medium uppercase text-faint">Events</p>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-ink">
                    <Activity size={16} className="text-accent" />
                    {selected.events}
                  </p>
                </div>
                <div className="rounded-xl bg-panel p-3">
                  <p className="text-[10px] font-medium uppercase text-faint">Commits</p>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-ink">
                    <GitCommit size={16} className="text-success" />
                    {selected.commits}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden h-64 items-center justify-center rounded-2xl border border-dashed border-line bg-panel/50 lg:flex">
              <div className="text-center">
                <FolderKanban size={32} className="mx-auto text-faint" />
                <p className="mt-2 text-sm text-faint">Select a task to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
