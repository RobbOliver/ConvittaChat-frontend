import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { clearToken } from '../../lib/authToken';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import { disconnectSocket } from '../../lib/socket';

type NavKey = 'home' | 'inbox' | 'settings';

const ITEMS: { key: NavKey; label: string; to: string }[] = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'inbox', label: 'Inbox', to: '/inbox' },
  { key: 'settings', label: 'Configurações', to: '/settings' },
];

export function SidebarNav({ active }: { active: NavKey }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    disconnectSocket();
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-paper dark:border-[#34353f] dark:bg-[#1a1b21]">
      <div className="flex items-start justify-between gap-2 px-5 pb-5 pt-6">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold tracking-tight text-ink dark:text-[#ececed]">
            Convitta
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-ink/35 dark:text-[#ececed]/35">
            Área de trabalho
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-mist hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 dark:text-[#ececed]/40 dark:hover:bg-[#24252e] dark:hover:text-[#ececed] ${PRESS_SM}`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((item) =>
          item.key === active ? (
            <span
              key={item.key}
              className="flex items-center gap-2 rounded-lg bg-signal-soft px-3 py-2 text-sm font-medium text-ink dark:bg-[#3a2f1f] dark:text-[#f7ecda]"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.key}
              to={item.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink/55 hover:bg-mist hover:text-ink dark:text-[#ececed]/55 dark:hover:bg-[#24252e] dark:hover:text-[#ececed] ${PRESS}`}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <div className="border-t border-line px-3 py-3 dark:border-[#34353f]">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm text-ink/55 hover:bg-mist hover:text-ink dark:text-[#ececed]/55 dark:hover:bg-[#24252e] dark:hover:text-[#ececed] ${PRESS}`}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a6.8 6.8 0 1 0 8.8 8.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.7v1.8M10 15.5v1.8M17.3 10h-1.8M4.5 10H2.7M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1 4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
