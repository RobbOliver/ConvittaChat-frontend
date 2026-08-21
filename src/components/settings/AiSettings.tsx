import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useCurrentUser, useUpdateAiConfig } from '../../hooks/useCurrentUser';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import { Toggle } from '../ui/Toggle';

const WEEKDAYS = [
  { day: 0, label: 'Dom' },
  { day: 1, label: 'Seg' },
  { day: 2, label: 'Ter' },
  { day: 3, label: 'Qua' },
  { day: 4, label: 'Qui' },
  { day: 5, label: 'Sex' },
  { day: 6, label: 'Sáb' },
];

function splitList(value: string): string[] | undefined {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function splitLines(value: string): string[] | undefined {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

/** The AI "brain" configuration — entirely admin-authored. Nothing here assumes a specific kind
 * of business: the admin describes their own business, tone and rules in free text, and the AI
 * uses exactly that (plus the catalog from AiCatalogEditor) to talk to customers. */
export function AiSettings() {
  const { data: user } = useCurrentUser();
  const updateAiConfig = useUpdateAiConfig();

  const [aiEnabled, setAiEnabled] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [persona, setPersona] = useState('');
  const [hoursDays, setHoursDays] = useState<number[]>([]);
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('19:00');
  const [serviceAreas, setServiceAreas] = useState('');
  const [paymentMethods, setPaymentMethods] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [policies, setPolicies] = useState('');
  const [extraRules, setExtraRules] = useState('');
  const [defaultObjective, setDefaultObjective] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [maxRepliesPerDay, setMaxRepliesPerDay] = useState('200');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setAiEnabled(user.aiEnabled);
    setBusinessName(user.aiBusinessName ?? '');
    setPersona(user.aiPersona ?? '');
    const structured = user.aiBusinessHours?.[0];
    setHoursDays(structured?.days ?? []);
    setHoursStart(structured?.start ?? '09:00');
    setHoursEnd(structured?.end ?? '19:00');
    setServiceAreas((user.aiBusinessInfo?.serviceAreas ?? []).join(', '));
    setPaymentMethods((user.aiBusinessInfo?.paymentMethods ?? []).join(', '));
    setMinOrder(
      user.aiBusinessInfo?.minOrderCents != null ? String(user.aiBusinessInfo.minOrderCents / 100) : '',
    );
    setPolicies((user.aiBusinessInfo?.policies ?? []).join('\n'));
    setExtraRules(user.aiExtraRules ?? '');
    setDefaultObjective(user.aiDefaultObjective ?? '');
    setFallbackMessage(user.aiFallbackMessage ?? '');
    setMaxRepliesPerDay(String(user.aiMaxRepliesPerDay));
  }, [user]);

  function markDirty() {
    setSaved(false);
  }

  function toggleDay(day: number) {
    setHoursDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
    markDirty();
  }

  function handleToggle(next: boolean) {
    setAiEnabled(next);
    setSaved(false);
    updateAiConfig.mutate(
      { aiEnabled: next },
      { onError: () => setAiEnabled(!next) },
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const minOrderCents = minOrder.trim() ? Math.round(Number(minOrder.replace(',', '.')) * 100) : undefined;

    updateAiConfig.mutate(
      {
        aiBusinessName: businessName.trim() || undefined,
        aiPersona: persona.trim() || undefined,
        aiBusinessInfo: {
          serviceAreas: splitList(serviceAreas),
          paymentMethods: splitList(paymentMethods),
          minOrderCents,
          policies: splitLines(policies),
        },
        aiBusinessHours:
          hoursDays.length > 0 && hoursStart && hoursEnd
            ? [{ days: hoursDays, start: hoursStart, end: hoursEnd }]
            : [],
        aiExtraRules: extraRules.trim() || undefined,
        aiDefaultObjective: defaultObjective.trim() || undefined,
        aiFallbackMessage: fallbackMessage.trim() || undefined,
        aiMaxRepliesPerDay: maxRepliesPerDay.trim() ? Number(maxRepliesPerDay) : undefined,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => {
          const message = axios.isAxiosError(err)
            ? (err.response?.data as { message?: string })?.message
            : undefined;
          setError(Array.isArray(message) ? message.join(', ') : (message ?? 'Não foi possível salvar. Tente novamente.'));
        },
      },
    );
  }

  const inputClass =
    'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]';
  const labelClass = 'mb-1 block text-xs font-medium text-ink/50 dark:text-[#ececed]/50';

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-3 dark:border-[#34353f] dark:bg-[#1a1b21]">
        <div>
          <p className="text-sm font-semibold text-ink dark:text-[#ececed]">Resposta automática</p>
          <p className="text-xs text-ink/50 dark:text-[#ececed]/50">
            Quando ativado, a IA responde sozinha em conversas individuais (nunca em grupos). Pode ser
            desligado por conversa também, no painel de contato.
          </p>
        </div>
        <Toggle checked={aiEnabled} onChange={handleToggle} label="Ativar resposta automática" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className={labelClass}>Nome do negócio</span>
          <input
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              markDirty();
            }}
            placeholder="Como a IA deve se apresentar (ex.: Studio Bela Vista)"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Tom e personalidade</span>
          <textarea
            value={persona}
            onChange={(e) => {
              setPersona(e.target.value);
              markDirty();
            }}
            rows={2}
            placeholder="Descreva como a IA deve falar — ex.: tom acolhedor, direto, sem emojis"
            className={inputClass}
          />
        </label>

        <label className="block max-w-[220px]">
          <span className={labelClass}>Valor mínimo (opcional)</span>
          <input
            value={minOrder}
            onChange={(e) => {
              setMinOrder(e.target.value);
              markDirty();
            }}
            inputMode="decimal"
            placeholder="Ex.: 25,00"
            className={inputClass}
          />
        </label>

        <div className="rounded-lg border border-line bg-white px-3 py-3 dark:border-[#34353f] dark:bg-[#1a1b21]">
          <span className={labelClass}>Horário de funcionamento</span>
          <p className="mb-2 text-xs text-ink/40 dark:text-[#ececed]/40">
            Isto é o que o sistema realmente confere — a IA nunca confirma um pedido pra um horário
            fora daqui, mesmo que o cliente insista, e é o mesmo texto que ela mostra pro cliente
            quando perguntam o horário.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map(({ day, label }) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${PRESS_SM} ${
                  hoursDays.includes(day)
                    ? 'border-signal bg-signal text-ink'
                    : 'border-line bg-paper text-ink/50 hover:bg-mist dark:border-[#34353f] dark:bg-[#1a1b21] dark:text-[#ececed]/50 dark:hover:bg-[#24252e]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="time"
              value={hoursStart}
              onChange={(e) => {
                setHoursStart(e.target.value);
                markDirty();
              }}
              className={`${inputClass} w-auto`}
            />
            <span className="text-sm text-ink/40 dark:text-[#ececed]/40">até</span>
            <input
              type="time"
              value={hoursEnd}
              onChange={(e) => {
                setHoursEnd(e.target.value);
                markDirty();
              }}
              className={`${inputClass} w-auto`}
            />
          </div>
          {hoursDays.length === 0 && (
            <p className="mt-2 text-xs text-ink/40 dark:text-[#ececed]/40">
              Nenhum dia selecionado — sem isso, o sistema não bloqueia nenhum horário nem mostra um
              horário de funcionamento pro cliente.
            </p>
          )}
        </div>

        <label className="block">
          <span className={labelClass}>Áreas atendidas (separadas por vírgula)</span>
          <input
            value={serviceAreas}
            onChange={(e) => {
              setServiceAreas(e.target.value);
              markDirty();
            }}
            placeholder="Ex.: Centro, Zona Sul"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Formas de pagamento (separadas por vírgula)</span>
          <input
            value={paymentMethods}
            onChange={(e) => {
              setPaymentMethods(e.target.value);
              markDirty();
            }}
            placeholder="Ex.: Pix, Cartão, Dinheiro"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Políticas (uma por linha)</span>
          <textarea
            value={policies}
            onChange={(e) => {
              setPolicies(e.target.value);
              markDirty();
            }}
            rows={3}
            placeholder={'Ex.: Cancelamento até 2h antes\nEntrega grátis acima de R$ 50'}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Regras de negócio extras</span>
          <textarea
            value={extraRules}
            onChange={(e) => {
              setExtraRules(e.target.value);
              markDirty();
            }}
            rows={2}
            placeholder="Qualquer instrução extra pro atendimento — ex.: sempre confirmar se já é cliente"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Objetivo padrão</span>
          <textarea
            value={defaultObjective}
            onChange={(e) => {
              setDefaultObjective(e.target.value);
              markDirty();
            }}
            rows={2}
            placeholder="O que a IA deve buscar por padrão em toda conversa — ex.: confirmar endereço e fechar pedido"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-ink/40 dark:text-[#ececed]/40">
            Vale pra todos os contatos automaticamente. Dá pra ajustar pontualmente por contato no
            painel de cada conversa — o ajuste específico sempre tem prioridade sobre este aqui.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Mensagem de recusa (quando a IA não pode ajudar)</span>
          <input
            value={fallbackMessage}
            onChange={(e) => {
              setFallbackMessage(e.target.value);
              markDirty();
            }}
            placeholder="Padrão: recusa educada genérica"
            className={inputClass}
          />
        </label>

        <label className="block max-w-[220px]">
          <span className={labelClass}>Limite de respostas automáticas por dia</span>
          <input
            value={maxRepliesPerDay}
            onChange={(e) => {
              setMaxRepliesPerDay(e.target.value.replace(/\D/g, ''));
              markDirty();
            }}
            inputMode="numeric"
            className={inputClass}
          />
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={updateAiConfig.isPending}
            className={`rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-50 ${PRESS}`}
          >
            {updateAiConfig.isPending ? 'Salvando…' : 'Salvar'}
          </button>
          {saved && <span className="text-sm text-ink/50 dark:text-[#ececed]/50">Salvo.</span>}
        </div>
        {error && <p className="text-sm text-stage-lost">{error}</p>}
      </form>

      <p className="text-xs text-ink/40 dark:text-[#ececed]/40">
        Proteções ativas por padrão, não configuráveis: bloqueio de tentativas de manipulação do
        assistente, verificação de preços e itens contra o catálogo cadastrado, e isolamento entre a
        mensagem do cliente e as instruções da IA.
      </p>
    </div>
  );
}
