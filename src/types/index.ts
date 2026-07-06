// Types matching BE contract from /data/*.json

export interface Overview {
  project: string;
  started_at: string;
  duration: string;
  members: number;
  tasks: number;
  events: number;
  commits: number;
  providers: Record<string, number>;
}

export interface TimelineEvent {
  time: string;
  type: "prompt" | "commit" | "decision";
  member: string;
  task: string;
  title: string;
  commit?: string | null;
}

export interface Task {
  id: string;
  title: string;
  status: "Done" | "In Progress" | "Todo";
  phase: string;
  assignee: string;
  events: number;
  commits: number;
  summary: string;
}

export interface Developer {
  name: string;
  role: string;
  avatar: string;
  events: number;
  tasks: number;
  commits: number;
  providers: Record<string, number>;
  phases: Record<string, number>;
  activity: Array<{ date: string; events: number }>;
}

export interface Report {
  project: {
    name: string;
    team: string;
    generated_at: string;
    duration: string;
  };
  summary: {
    events: number;
    tasks: number;
    commits: number;
    providers: Record<string, number>;
  };
  phases: Array<{
    name: string;
    events: number;
    summary: string;
  }>;
  lessons_learned: string[];
  key_decisions: Array<{
    title: string;
    reason: string;
  }>;
  metrics: {
    acceptance_rate: number;
    average_response_time: number;
    average_prompt_per_task: number;
    generated_files: number;
    unit_tests_generated: number;
  };
}

export type PageId = "import" | "overview" | "timeline" | "tasks" | "developers" | "report";

// Dashboard data state
export interface DashboardData {
  overview: Overview | null;
  timeline: TimelineEvent[];
  tasks: Task[];
  developers: Developer[];
  report: Report | null;
}
