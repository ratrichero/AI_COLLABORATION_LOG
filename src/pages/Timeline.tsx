import { useState, useMemo } from "react";
import {
  Clock,
  User,
  FolderKanban,
  GitCommit,
  MessageSquare,
  Lightbulb,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Box,
} from "lucide-react";
import type { TimelineEvent } from "../types";

interface TimelineProps {
  data: TimelineEvent[];
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; cls: string }> = {
  prompt: { icon: <MessageSquare size={14} />, cls: "bg-accent-soft text-accent" },
  commit: { icon: <GitCommit size={14} />, cls: "bg-success/10 text-success" },
  decision: { icon: <Lightbulb size={14} />, cls: "bg-warning/10 text-warning" },
};

const MEMBER_COLORS: Record<string, string> = {
  Minh: "#8b5cf6",
  Linh: "#3b82f6",
  Duc: "#10b981",
  Hoa: "#f59e0b",
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Extract phase/module from task ID or title
function inferPhase(event: TimelineEvent): string {
  const task = event.task.toLowerCase();
  if (task.includes("core")) return "Core";
  if (task.includes("fe") || task.includes("frontend")) return "Frontend";
  if (task.includes("be") || task.includes("backend")) return "Backend";
  if (task.includes("cli")) return "CLI";
  if (task.includes("test")) return "Testing";
  if (task.includes("doc")) return "Documentation";
  return "Other";
}

function inferModule(event: TimelineEvent): string {
  const title = event.title.toLowerCase();
  const task = event.task.toLowerCase();
  
  if (title.includes("pipeline") || task.includes("pipeline")) return "Pipeline";
  if (title.includes("dashboard") || task.includes("fe")) return "Dashboard";
  if (title.includes("cli") || task.includes("cli")) return "CLI";
  if (title.includes("provider") || title.includes("ai adapter")) return "Provider";
  if (title.includes("cache")) return "Cache";
  if (title.includes("report")) return "Report";
  if (title.includes("test")) return "Testing";
  return "General";
}

export default function Timeline({ data }: TimelineProps) {
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterTask, setFilterTask] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week">("all");

  // Extract unique values for filters
  const { members, types, phases, modules, tasks } = useMemo(() => {
    const membersSet = new Set<string>();
    const typesSet = new Set<string>();
    const phasesSet = new Set<string>();
    const modulesSet = new Set<string>();
    const tasksSet = new Set<string>();

    data.forEach((e) => {
      membersSet.add(e.member);
      typesSet.add(e.type);
      phasesSet.add(inferPhase(e));
      modulesSet.add(inferModule(e));
      tasksSet.add(e.task);
    });

    return {
      members: Array.from(membersSet).sort(),
      types: Array.from(typesSet).sort(),
      phases: Array.from(phasesSet).sort(),
      modules: Array.from(modulesSet).sort(),
      tasks: Array.from(tasksSet).sort(),
    };
  }, [data]);

  // Filter data
  const filtered = useMemo(() => {
    return data.filter((e) => {
      if (filterMember !== "all" && e.member !== filterMember) return false;
      if (filterType !== "all" && e.type !== filterType) return false;
      if (filterPhase !== "all" && inferPhase(e) !== filterPhase) return false;
      if (filterModule !== "all" && inferModule(e) !== filterModule) return false;
      if (filterTask !== "all" && e.task !== filterTask) return false;
      
      // Date range filter
      if (dateRange !== "all") {
        const eventDate = new Date(e.time);
        const now = new Date();
        if (dateRange === "today") {
          if (eventDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (eventDate < weekAgo) return false;
        }
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.task.toLowerCase().includes(q) ||
          e.member.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, filterMember, filterType, filterPhase, filterModule, filterTask, dateRange, searchQuery]);

  // Count active filters
  const activeFilterCount = [
    filterMember !== "all",
    filterType !== "all",
    filterPhase !== "all",
    filterModule !== "all",
    filterTask !== "all",
    dateRange !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterMember("all");
    setFilterType("all");
    setFilterPhase("all");
    setFilterModule("all");
    setFilterTask("all");
    setDateRange("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-ink">Timeline</h2>
        <p className="mt-1 text-sm text-muted">
          Chronological view of all AI collaboration events
        </p>
      </div>

      {/* Search & Filter Toggle (Mobile) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Search events..."
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

      {/* Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">Filter Options</h4>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-accent hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Member Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <User size={12} />
                Member
              </label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {members.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <MessageSquare size={12} />
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
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

            {/* Module Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <Box size={12} />
                Module
              </label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Task Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <FolderKanban size={12} />
                Task
              </label>
              <select
                value={filterTask}
                onChange={(e) => setFilterTask(e.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All</option>
                {tasks.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
                <Clock size={12} />
                Date
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as "all" | "today" | "week")}
                className="w-full rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results count & quick stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-faint">
          Showing <span className="font-medium text-ink">{filtered.length}</span> of {data.length} events
        </p>
        <div className="flex flex-wrap gap-2">
          {filterMember !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              <User size={10} /> {filterMember}
              <button onClick={() => setFilterMember("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
          {filterPhase !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              <Layers size={10} /> {filterPhase}
              <button onClick={() => setFilterPhase("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
          {filterModule !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">
              <Box size={10} /> {filterModule}
              <button onClick={() => setFilterModule("all")} className="hover:text-ink">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {filtered.length > 0 ? (
        <div className="relative">
          {/* Vertical line - hidden on mobile */}
          <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-gradient-to-b from-accent/40 via-accent-2/30 to-transparent sm:left-6 sm:block" />

          <div className="space-y-3 sm:space-y-4">
            {filtered.map((event, idx) => {
              const prevDate = idx > 0 ? formatDate(filtered[idx - 1].time) : null;
              const currentDate = formatDate(event.time);
              const showDateSep = currentDate !== prevDate;
              const typeConfig = TYPE_CONFIG[event.type] || TYPE_CONFIG.prompt;
              const memberColor = MEMBER_COLORS[event.member] || "#8b5cf6";

              return (
                <div key={`${event.time}-${idx}`}>
                  {showDateSep && (
                    <div className="relative mb-3 flex items-center gap-3 pl-0 sm:mb-4 sm:pl-12">
                      <span className="text-xs font-semibold text-muted">{currentDate}</span>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                  )}

                  <div className="relative flex gap-3 sm:gap-4">
                    {/* Timeline dot - adjusted for mobile */}
                    <div
                      className="relative z-10 mt-3 hidden h-3 w-3 shrink-0 items-center justify-center rounded-full ring-4 ring-bg sm:flex"
                      style={{ backgroundColor: memberColor, marginLeft: "18px" }}
                    />

                    {/* Event card */}
                    <div className="flex-1 rounded-xl border border-line bg-surface p-3 shadow-sm transition-all hover:border-line-strong hover:shadow-md sm:rounded-2xl sm:p-4">
                      {/* Meta tags - responsive layout */}
                      <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] text-faint sm:text-xs">
                          <Clock size={10} className="sm:h-3 sm:w-3" />
                          {formatTime(event.time)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 sm:text-[10px]"
                          style={{ backgroundColor: memberColor + "22", color: memberColor }}
                        >
                          <User size={9} className="sm:h-2.5 sm:w-2.5" />
                          {event.member}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-panel px-1.5 py-0.5 text-[9px] font-medium text-muted sm:px-2 sm:text-[10px]">
                          <FolderKanban size={9} className="sm:h-2.5 sm:w-2.5" />
                          {event.task}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:text-[10px] ${typeConfig.cls}`}>
                          {typeConfig.icon}
                          <span className="hidden xs:inline">{event.type}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-medium text-ink">{event.title}</p>

                      {/* Commit link */}
                      {event.commit && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                          <GitCommit size={12} className="text-success" />
                          <span className="font-mono text-[10px] sm:text-xs">{event.commit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-line bg-panel/50 sm:h-64">
          <div className="text-center">
            <Clock size={28} className="mx-auto text-faint sm:h-8 sm:w-8" />
            <p className="mt-2 text-sm text-faint">No events found</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
