import { Sun, TerminalSquare } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface/60 p-0.5">
      <button
        onClick={() => setTheme('light')}
        aria-label="Light theme"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          theme === 'light'
            ? 'bg-accent-soft text-accent'
            : 'text-muted hover:text-ink'
        }`}
      >
        <Sun size={13} />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        onClick={() => setTheme('dev')}
        aria-label="Dev theme"
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          theme === 'dev'
            ? 'bg-accent-soft text-accent'
            : 'text-muted hover:text-ink'
        }`}
      >
        <TerminalSquare size={13} />
        <span className="hidden sm:inline">Dev</span>
      </button>
    </div>
  );
}
