import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setToken } from '../lib/authToken';
import { PRESS } from '../lib/interactions';
import { connectSocket } from '../lib/socket';

type Mode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const { data } = await api.post<{ accessToken: string }>(path, body);
      setToken(data.accessToken);
      connectSocket();
      navigate('/', { replace: true });
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? 'Algo deu errado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold text-white">Convitta</p>
          <p className="mt-1 text-sm text-white/50">Todas as conversas do WhatsApp, em um só lugar</p>
        </div>

        <div className="rounded-2xl bg-paper p-6 shadow-xl">
          <div className="mb-5 flex rounded-full bg-mist p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                mode === 'login' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full py-1.5 ${PRESS} ${
                mode === 'register' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60" htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              />
            </div>

            {error && <p className="text-sm text-stage-lost">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-60 ${PRESS}`}
            >
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
