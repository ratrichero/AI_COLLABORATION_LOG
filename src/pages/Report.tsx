import {
  FileText,
  Download,
  CheckCircle2,
  BarChart3,
  Cpu,
  Users,
  Layers,
  Target,
  BookOpen,
  Lightbulb,
  Timer,
  FileCode,
  TestTube,
  TrendingUp,
} from "lucide-react";
import type { Report } from "../types";

interface ReportPageProps {
  data: Report;
}

/** Format acceptance_rate: if <= 1 treat as decimal (multiply by 100), else use as-is */
function formatPercent(value: number): string {
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
      <div className="flex items-center gap-2 border-b border-line pb-3 sm:gap-2.5 sm:pb-4">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-bold text-ink sm:text-base">{title}</h3>
      </div>
      <div className="pt-3 sm:pt-4">{children}</div>
    </section>
  );
}

export default function ReportPage({ data }: ReportPageProps) {
  const totalProviderEvents = Object.values(data.summary.providers).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">AI Collaboration Report</h2>
          <p className="mt-1 text-sm text-muted">
            Auto-generated • {data.project.name}
          </p>
        </div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-solid px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent-solid-hover sm:w-auto">
          <Download size={16} />
          Export MD
        </button>
      </div>

      {/* Project Info Card */}
      <div className="rounded-xl bg-gradient-to-r from-accent-solid to-accent-2 p-4 text-white shadow-xl shadow-accent/20 sm:rounded-2xl sm:p-6">
        <div className="flex items-center gap-2 text-white/75">
          <FileText size={14} className="sm:h-4 sm:w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
            AI-COLLABORATION.md
          </span>
        </div>
        <h3 className="mt-2 text-lg font-bold sm:text-xl">{data.project.name}</h3>
        <p className="mt-1 text-xs text-white/85 sm:text-sm">
          Team: {data.project.team} • Duration: {data.project.duration}
        </p>
        <p className="mt-1 text-[10px] text-white/65 sm:text-xs">
          Generated: {new Date(data.project.generated_at).toLocaleString("vi-VN")}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs sm:mt-4 sm:gap-4 sm:text-sm">
          <span>📊 {data.summary.events}</span>
          <span>📁 {data.summary.tasks}</span>
          <span>🔗 {data.summary.commits}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <Section icon={<BarChart3 size={18} />} title="1. Summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-accent sm:text-2xl">{data.summary.events}</p>
            <p className="text-[10px] text-faint sm:text-xs">Total Events</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-info sm:text-2xl">{data.summary.tasks}</p>
            <p className="text-[10px] text-faint sm:text-xs">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success sm:text-2xl">{data.summary.commits}</p>
            <p className="text-[10px] text-faint sm:text-xs">Total Commits</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-warning sm:text-2xl">
              {Object.keys(data.summary.providers).length}
            </p>
            <p className="text-[10px] text-faint sm:text-xs">Providers</p>
          </div>
        </div>
      </Section>

      {/* Phases */}
      <Section icon={<Layers size={18} />} title="2. Development Phases">
        <div className="space-y-3 sm:space-y-4">
          {data.phases.map((phase, idx) => (
            <div key={phase.name} className="rounded-lg border border-line p-3 sm:rounded-xl sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-bold text-accent sm:h-6 sm:w-6 sm:text-xs">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-ink">{phase.name}</h4>
                </div>
                <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] text-muted">
                  {phase.events} events
                </span>
              </div>
              <p className="mt-2 text-xs text-muted sm:text-sm">{phase.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Key Decisions */}
      <Section icon={<Lightbulb size={18} />} title="3. Key Decisions">
        <div className="space-y-2 sm:space-y-3">
          {data.key_decisions.map((decision, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 sm:gap-3 sm:rounded-xl sm:p-4"
            >
              <Target size={14} className="mt-0.5 shrink-0 text-warning sm:h-4 sm:w-4" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{decision.title}</p>
                <p className="mt-1 text-xs text-muted sm:text-sm">{decision.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Lessons Learned */}
      <Section icon={<BookOpen size={18} />} title="4. Lessons Learned">
        <div className="rounded-lg bg-success/10 p-3 sm:rounded-xl sm:p-4">
          <ul className="space-y-2">
            {data.lessons_learned.map((lesson, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-ink sm:text-sm">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success sm:h-3.5 sm:w-3.5" />
                <span className="min-w-0">{lesson}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Metrics */}
      <Section icon={<TrendingUp size={18} />} title="5. Metrics">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          <div className="rounded-lg bg-panel p-3 text-center sm:rounded-xl sm:p-4">
            <CheckCircle2 size={14} className="mx-auto text-accent sm:h-4 sm:w-4" />
            <p className="mt-1.5 text-lg font-bold text-ink sm:mt-2 sm:text-xl">
              {formatPercent(data.metrics.acceptance_rate)}
            </p>
            <p className="text-[9px] text-faint sm:text-[10px]">Acceptance</p>
          </div>
          <div className="rounded-lg bg-panel p-3 text-center sm:rounded-xl sm:p-4">
            <Timer size={14} className="mx-auto text-info sm:h-4 sm:w-4" />
            <p className="mt-1.5 text-lg font-bold text-ink sm:mt-2 sm:text-xl">
              {data.metrics.average_response_time}s
            </p>
            <p className="text-[9px] text-faint sm:text-[10px]">Avg Time</p>
          </div>
          <div className="rounded-lg bg-panel p-3 text-center sm:rounded-xl sm:p-4">
            <Users size={14} className="mx-auto text-info sm:h-4 sm:w-4" />
            <p className="mt-1.5 text-lg font-bold text-ink sm:mt-2 sm:text-xl">
              {data.metrics.average_prompt_per_task}
            </p>
            <p className="text-[9px] text-faint sm:text-[10px]">Prompts/Task</p>
          </div>
          <div className="rounded-lg bg-panel p-3 text-center sm:rounded-xl sm:p-4">
            <FileCode size={14} className="mx-auto text-success sm:h-4 sm:w-4" />
            <p className="mt-1.5 text-lg font-bold text-ink sm:mt-2 sm:text-xl">
              {data.metrics.generated_files}
            </p>
            <p className="text-[9px] text-faint sm:text-[10px]">Files</p>
          </div>
          <div className="col-span-2 rounded-lg bg-panel p-3 text-center sm:col-span-1 sm:rounded-xl sm:p-4">
            <TestTube size={14} className="mx-auto text-warning sm:h-4 sm:w-4" />
            <p className="mt-1.5 text-lg font-bold text-ink sm:mt-2 sm:text-xl">
              {data.metrics.unit_tests_generated}
            </p>
            <p className="text-[9px] text-faint sm:text-[10px]">Tests</p>
          </div>
        </div>
      </Section>

      {/* Provider Usage */}
      <Section icon={<Cpu size={18} />} title="6. AI Provider Usage">
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(data.summary.providers).map(([provider, count]) => {
            const pct = totalProviderEvents > 0 ? (count / totalProviderEvents) * 100 : 0;
            return (
              <div key={provider}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{provider}</span>
                  <span className="text-[10px] text-faint sm:text-xs">
                    {count} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-panel sm:h-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
