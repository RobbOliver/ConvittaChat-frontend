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
    updatePixConfig.mutate(
      {
        pixKey: pixKey.trim(),
        pixKeyType,
        pixMerchantName: pixMerchantName.trim(),
        pixMerchantCity: pixMerchantCity.trim() || undefined,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50">Tipo de chave</span>
        <select
          value={pixKeyType}
          onChange={(event) => {
            setPixKeyType(event.target.value as PixKeyType);
            setSaved(false);
          }}
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
        >
          {(Object.keys(PIX_KEY_TYPE_LABEL) as PixKeyType[]).map((type) => (
            <option key={type} value={type}>
              {PIX_KEY_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50">Chave Pix</span>
        <input
          value={pixKey}
          onChange={(event) => {
            setPixKey(event.target.value);
            setSaved(false);
          }}
          placeholder="Ex.: email@exemplo.com"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50">Nome do beneficiário</span>
        <input
          value={pixMerchantName}
          onChange={(event) => {
            setPixMerchantName(event.target.value);
            setSaved(false);
          }}
          maxLength={25}
          placeholder="Como aparece pro cliente que recebe o pagamento"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink/50">Cidade (opcional)</span>
        <input
          value={pixMerchantCity}
          onChange={(event) => {
            setPixMerchantCity(event.target.value);
            setSaved(false);
          }}
          maxLength={15}
          placeholder="Ex.: São Paulo"
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
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
        {saved && <span className="text-sm text-ink/50">Salvo.</span>}
        {updatePixConfig.isError && (
          <span className="text-sm text-stage-lost">Não foi possível salvar. Tente novamente.</span>
        )}
      </div>
    </form>
  );
}
