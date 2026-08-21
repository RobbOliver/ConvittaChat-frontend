import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useCurrentUser, useUpdatePixConfig } from '../../hooks/useCurrentUser';
import { PRESS } from '../../lib/interactions';
import type { PixKeyType } from '../../types';

const PIX_KEY_TYPE_LABEL: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'Email',
  PHONE: 'Telefone',
  RANDOM: 'Chave aleatória',
};

// Must match exactly the format your bank registered the key under — a Pix key that's merely
// formatted differently (dots in a CPF, a phone missing the country code) points at nothing.
const PIX_KEY_TYPE_PLACEHOLDER: Record<PixKeyType, string> = {
  CPF: 'Ex.: 12345678900 (com ou sem pontuação)',
  CNPJ: 'Ex.: 12345678000199 (com ou sem pontuação)',
  EMAIL: 'Ex.: email@exemplo.com',
  PHONE: 'Ex.: 11988887777 (DDD + número, sem +55)',
  RANDOM: 'Cole a chave aleatória exata do app do banco',
};

/** Configures the Pix key used to generate "Cobrar via Pix" charges from any conversation — set
 * once here, reused everywhere, so it never needs retyping per contact or per charge. */
export function PixSettings() {
  const { data: user } = useCurrentUser();
  const updatePixConfig = useUpdatePixConfig();

  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('EMAIL');
  const [pixMerchantName, setPixMerchantName] = useState('');
  const [pixMerchantCity, setPixMerchantCity] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setPixKey(user.pixKey ?? '');
    setPixKeyType(user.pixKeyType ?? 'EMAIL');
    setPixMerchantName(user.pixMerchantName ?? '');
    setPixMerchantCity(user.pixMerchantCity ?? '');
  }, [user]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!pixKey.trim() || !pixMerchantName.trim()) return;
    setSaved(false);
    setError(null);
    updatePixConfig.mutate(
      {
        pixKey: pixKey.trim(),
        pixKeyType,
        pixMerchantName: pixMerchantName.trim(),
        pixMerchantCity: pixMerchantCity.trim() || undefined,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => {
          const message = axios.isAxiosError(err)
            ? (err.response?.data as { message?: string })?.message
            : undefined;
          setError(message ?? 'Não foi possível salvar. Tente novamente.');
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50 dark:text-[#ececed]/50">Tipo de chave</span>
        <select
          value={pixKeyType}
          onChange={(event) => {
            setPixKeyType(event.target.value as PixKeyType);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
        >
          {(Object.keys(PIX_KEY_TYPE_LABEL) as PixKeyType[]).map((type) => (
            <option key={type} value={type}>
              {PIX_KEY_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50 dark:text-[#ececed]/50">Chave Pix</span>
        <input
          value={pixKey}
          onChange={(event) => {
            setPixKey(event.target.value);
            setSaved(false);
          }}
          placeholder={PIX_KEY_TYPE_PLACEHOLDER[pixKeyType]}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50 dark:text-[#ececed]/50">Nome do beneficiário</span>
        <input
          value={pixMerchantName}
          onChange={(event) => {
            setPixMerchantName(event.target.value);
            setSaved(false);
          }}
          maxLength={25}
          placeholder="Como aparece pro cliente que recebe o pagamento"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50 dark:text-[#ececed]/50">Cidade (opcional)</span>
        <input
          value={pixMerchantCity}
          onChange={(event) => {
            setPixMerchantCity(event.target.value);
            setSaved(false);
          }}
          maxLength={15}
          placeholder="Ex.: São Paulo"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]"
        />
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!pixKey.trim() || !pixMerchantName.trim() || updatePixConfig.isPending}
          className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
        >
          {updatePixConfig.isPending ? 'Salvando…' : 'Salvar'}
        </button>
        {saved && <span className="text-sm text-ink/50 dark:text-[#ececed]/50">Salvo.</span>}
      </div>
      {error && <p className="text-sm text-stage-lost">{error}</p>}
    </form>
  );
}
