import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  Users,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import type { PageId } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggle: () => void;
  hasData?: boolean;
  hasWarnings?: boolean;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'import', label: 'Import', icon: <Upload size={20} /> },
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock size={20} /> },
  { id: 'tasks', label: 'Task Explorer', icon: <FolderKanban size={20} /> },
  { id: 'developers', label: 'Developers', icon: <Users size={20} /> },
  { id: 'report', label: 'AI Collab Report', icon: <FileText size={20} /> },
];

export default function Sidebar({ 
  currentPage, 
  onNavigate, 
  collapsed, 
  onToggle,
  hasData = false,
  hasWarnings = false,
}: SidebarProps) {
  const { isDev } = useTheme();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-line bg-surface/80 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-line px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-solid to-accent-2 shadow-lg shadow-accent/30">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="flex items-center gap-1 text-sm font-bold tracking-tight text-ink">
              ADTS
              {isDev && <span className="dev-cursor text-accent">_</span>}
            </h1>
            <p className="truncate text-[10px] text-faint">AI Native Dev Toolkit</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const isImport = item.id === 'import';
          const showBadge = isImport && !hasData && !isActive;
          const showWarningDot = isImport && hasWarnings && hasData;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-elevated hover:text-ink'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`shrink-0 ${
                  isActive ? 'text-accent' : 'text-faint group-hover:text-muted'
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
              )}
              
              {/* Badge for Import when no data */}
              {showBadge && (
                <span className={`absolute ${collapsed ? 'right-1 top-1' : 'right-3'} flex h-2 w-2`}>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              )}
              
              {/* Warning dot when has warnings */}
              {showWarningDot && (
                <span className={`absolute ${collapsed ? 'right-1 top-1' : 'right-3'} h-2 w-2 rounded-full bg-warning`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Toggle */}
      <div className="border-t border-line p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-faint transition-colors hover:bg-elevated hover:text-muted"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
