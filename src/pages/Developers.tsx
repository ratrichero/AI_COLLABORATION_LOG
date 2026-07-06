import { useState } from "react";
import {
  Activity,
  GitCommit,
  FolderKanban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  LineChart,
  Line,
} from "recharts";
import type { Developer } from "../types";
import { useTheme, getChartTheme } from "../theme/ThemeProvider";

interface DevelopersProps {
  data: Developer[];
}

const DEV_COLORS: Record<string, string> = {
  Minh: "#8b5cf6",
  Linh: "#3b82f6",
  Duc: "#10b981",
  Hoa: "#f59e0b",
};

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10a37f",
  Claude: "#d97706",
  Gemini: "#4285f4",
  Google: "#4285f4",
  OpenRouter: "#8b5cf6",
  Unknown: "#64748b",
};

export default function Developers({ data }: DevelopersProps) {
  const { theme } = useTheme();
  const ct = getChartTheme(theme);
  const [expandedDev, setExpandedDev] = useState<string | null>(null);

  const tooltipStyle = {
    borderRadius: "12px",
    border: `1px solid ${ct.tipBorder}`,
    background: ct.tipBg,
    color: ct.tipText,
    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    fontSize: "11px",
  };

  const comparisonData = data.map((d) => ({
    name: d.name,
    events: d.events,
    tasks: d.tasks,
    commits: d.commits,
  }));

  const allPhases = Array.from(new Set(data.flatMap((d) => Object.keys(d.phases))));
  const radarData = allPhases.map((phase) => {
    const entry: Record<string, string | number> = { phase };
    data.forEach((d) => {
      entry[d.name] = d.phases[phase] || 0;
    });
    return entry;
  });

  const toggleExpand = (name: string) => {
    setExpandedDev(expandedDev === name ? null : name);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink sm:text-2xl">Developer Activity</h2>
        <p className="mt-1 text-sm text-muted">
          Individual and comparative activity across the team
        </p>
      </div>

      {/* Developer Cards - Responsive grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {data.map((dev) => {
          const color = DEV_COLORS[dev.name] || "#8b5cf6";
          const topProvider = Object.entries(dev.providers).sort(([, a], [, b]) => b - a)[0];
          const totalProviderEvents = Object.values(dev.providers).reduce((a, b) => a + b, 0);
          const isExpanded = expandedDev === dev.name;

          return (
            <div
              key={dev.name}
              className="rounded-xl border border-line bg-surface shadow-sm transition-all hover:border-line-strong hover:shadow-md sm:rounded-2xl"
            >
              {/* Main content */}
              <div className="p-3 sm:p-5">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-white shadow-lg sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                      boxShadow: `0 4px 12px ${color}30`,
                    }}
                  >
                    {dev.avatar || dev.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink">{dev.name}</h3>
                    <p className="truncate text-xs text-faint">{dev.role}</p>
                  </div>
                  {/* Expand button on mobile */}
                  <button
                    onClick={() => toggleExpand(dev.name)}
                    className="rounded-lg p-1.5 text-faint hover:bg-elevated hover:text-muted sm:hidden"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
                  <div className="rounded-lg bg-panel p-2 text-center">
                    <Activity size={12} className="mx-auto text-accent sm:h-3.5 sm:w-3.5" />
                    <p className="mt-1 text-sm font-bold text-ink">{dev.events}</p>
                    <p className="text-[8px] text-faint sm:text-[9px]">Events</p>
                  </div>
                  <div className="rounded-lg bg-panel p-2 text-center">
                    <FolderKanban size={12} className="mx-auto text-info sm:h-3.5 sm:w-3.5" />
                    <p className="mt-1 text-sm font-bold text-ink">{dev.tasks}</p>
                    <p className="text-[8px] text-faint sm:text-[9px]">Tasks</p>
                  </div>
                  <div className="rounded-lg bg-panel p-2 text-center">
                    <GitCommit size={12} className="mx-auto text-success sm:h-3.5 sm:w-3.5" />
                    <p className="mt-1 text-sm font-bold text-ink">{dev.commits}</p>
                    <p className="text-[8px] text-faint sm:text-[9px]">Commits</p>
                  </div>
                </div>

                {/* Provider bar - Always visible on desktop, collapsible on mobile */}
                <div className={`mt-3 ${isExpanded ? "" : "hidden sm:block"}`}>
                  {totalProviderEvents > 0 && (
                    <>
                      <p className="text-[9px] font-medium uppercase text-faint">
                        Top: {topProvider?.[0]}
                      </p>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-panel sm:h-2">
                        {Object.entries(dev.providers).map(([provider, count]) => {
                          const pct = (count / totalProviderEvents) * 100;
                          return (
                            <div
                              key={provider}
                              className="h-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PROVIDER_COLORS[provider] || "#94a3b8",
                              }}
                              title={`${provider}: ${count}`}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        {Object.entries(dev.providers).map(([provider, count]) => (
                          <span key={provider} className="text-[8px] text-faint sm:text-[9px]">
                            {provider}: {count}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Phases */}
                  {Object.keys(dev.phases).length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <p className="text-[9px] font-medium uppercase text-faint">Phases</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(dev.phases).map(([phase, count]) => (
                          <span
                            key={phase}
                            className="rounded-full bg-panel px-1.5 py-0.5 text-[8px] text-muted sm:px-2 sm:text-[9px]"
                          >
                            {phase}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity sparkline */}
                  {dev.activity && dev.activity.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <p className="text-[9px] font-medium uppercase text-faint">Recent</p>
                      <div className="mt-1 h-10 sm:h-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dev.activity}>
                            <Line
                              type="monotone"
                              dataKey="events"
                              stroke={color}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Charts */}
      {data.length > 0 && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Activity comparison */}
          <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
            <h3 className="text-sm font-semibold text-ink">Activity Comparison</h3>
            <p className="mb-3 text-xs text-faint sm:mb-4">Events, tasks and commits</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke={ct.axis} />
                <YAxis tick={{ fontSize: 10 }} stroke={ct.axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: ct.grid }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="events" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Events" />
                <Bar dataKey="tasks" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Tasks" />
                <Bar dataKey="commits" fill="#10b981" radius={[4, 4, 0, 0]} name="Commits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Phase Radar */}
          {radarData.length > 0 && (
            <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:rounded-2xl sm:p-6">
              <h3 className="text-sm font-semibold text-ink">Phase Coverage</h3>
              <p className="mb-3 text-xs text-faint sm:mb-4">Activity per phase</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={ct.grid} />
                  <PolarAngleAxis dataKey="phase" tick={{ fontSize: 9, fill: ct.axis }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: ct.axis }} />
                  {data.map((dev) => (
                    <Radar
                      key={dev.name}
                      name={dev.name}
                      dataKey={dev.name}
                      stroke={DEV_COLORS[dev.name] || "#8b5cf6"}
                      fill={DEV_COLORS[dev.name] || "#8b5cf6"}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
