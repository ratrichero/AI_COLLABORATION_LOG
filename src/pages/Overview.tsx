import {
  Activity,
  Users,
  FolderKanban,
  Clock,
  GitCommit,
  CalendarDays,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Overview } from "../types";
import { useTheme, getChartTheme } from "../theme/ThemeProvider";

interface OverviewPageProps {
  data: Overview;
}

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10a37f",
  Claude: "#d97706",
  Gemini: "#4285f4",
  Google: "#4285f4",
  OpenRouter: "#8b5cf6",
  Codex: "#ef4444",
  "Meta/Mistral": "#f97316",
  DeepSeek: "#06b6d4",
  Other: "#94a3b8",
  Unknown: "#64748b",
};

const PIE_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"];

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="group rounded-xl border border-line bg-surface p-3 shadow-sm transition-all hover:border-line-strong hover:shadow-md sm:rounded-2xl sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-faint sm:text-xs">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold text-ink sm:mt-2 sm:text-2xl">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-faint sm:mt-1 sm:text-xs">{sub}</p>}
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110 sm:h-10 sm:w-10 sm:rounded-xl"
          style={{ backgroundColor: color + "20", color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage({ data }: OverviewPageProps) {
  const { theme } = useTheme();
  const ct = getChartTheme(theme);

  const providerData = Object.entries(data.providers).map(([name, value]) => ({
    name,
    events: value,
  }));
  const providerPieData = Object.entries(data.providers).map(([name, value]) => ({
    name,
    value,
  }));
  const totalProviderEvents = Object.values(data.providers).reduce((a, b) => a + b, 0);

  const tooltipStyle = {
    borderRadius: "12px",
    border: `1px solid ${ct.tipBorder}`,
    background: ct.tipBg,
    color: ct.tipText,
    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    fontSize: "12px",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink sm:text-2xl">Overview</h2>
        <p className="mt-1 text-sm text-muted">{data.project}</p>
      </div>

      {/* Project Info Bar */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-medium text-muted sm:px-3 sm:py-1.5 sm:text-xs">
          <CalendarDays size={10} className="text-accent sm:h-3 sm:w-3" />
          Started: {new Date(data.started_at).toLocaleDateString("vi-VN")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-medium text-muted sm:px-3 sm:py-1.5 sm:text-xs">
          <Clock size={10} className="text-info sm:h-3 sm:w-3" />
          Duration: {data.duration}
        </span>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Activity size={16} className="sm:h-5 sm:w-5" />}
          label="Total Events"
          value={data.events}
          sub="AI interactions"
          color="#8b5cf6"
        />
        <StatCard
          icon={<FolderKanban size={16} className="sm:h-5 sm:w-5" />}
          label="Tasks"
          value={data.tasks}
          sub="Total tasks"
          color="#6366f1"
        />
        <StatCard
          icon={<Users size={16} className="sm:h-5 sm:w-5" />}
          label="Members"
          value={data.members}
          sub="Team members"
          color="#3b82f6"
        />
        <StatCard
          icon={<GitCommit size={16} className="sm:h-5 sm:w-5" />}
          label="Commits"
          value={data.commits}
          sub="Git commits"
          color="#10b981"
        />
      </div>

      {/* Charts - Stack on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Provider Distribution Pie */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
          <h3 className="text-sm font-semibold text-ink">Provider Distribution</h3>
          <p className="mb-3 text-xs text-faint sm:mb-4">Events per AI provider</p>
          {providerPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={providerPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {providerPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PROVIDER_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-faint">
              No provider data
            </div>
          )}
        </div>

        {/* Provider Usage Bar */}
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
          <h3 className="text-sm font-semibold text-ink">Provider Usage</h3>
          <p className="mb-3 text-xs text-faint sm:mb-4">Events count per provider</p>
          {providerData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={providerData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke={ct.axis} />
                <YAxis tick={{ fontSize: 10 }} stroke={ct.axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: ct.grid }} />
                <Bar dataKey="events" radius={[6, 6, 0, 0]}>
                  {providerData.map((entry) => (
                    <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] || "#8b5cf6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-faint">
              No provider data
            </div>
          )}
        </div>
      </div>

      {/* Provider breakdown list */}
      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <h3 className="text-sm font-semibold text-ink">Provider Breakdown</h3>
        <p className="mb-3 text-xs text-faint sm:mb-4">Detailed usage per provider</p>
        <div className="space-y-2 sm:space-y-3">
          {Object.entries(data.providers).map(([provider, count]) => {
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
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PROVIDER_COLORS[provider] || "#8b5cf6",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
