import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../../lib/authToken';
import { PRESS } from '../../lib/interactions';
import { disconnectSocket } from '../../lib/socket';

type NavKey = 'home' | 'inbox' | 'settings';

const ITEMS: { key: NavKey; label: string; to: string }[] = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'inbox', label: 'Inbox', to: '/inbox' },
  { key: 'settings', label: 'Configurações', to: '/settings' },
];

export function SidebarNav({ active }: { active: NavKey }) {
  const navigate = useNavigate();

  function handleLogout() {
    disconnectSocket();
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-ink">
      <div className="px-5 pb-5 pt-6">
        <p className="font-display text-xl font-semibold tracking-tight text-white">Convitta</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Área de trabalho</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((item) =>
          item.key === active ? (
            <span
              key={item.key}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.key}
              to={item.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white ${PRESS}`}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm text-white/60 hover:bg-white/5 hover:text-white ${PRESS}`}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
