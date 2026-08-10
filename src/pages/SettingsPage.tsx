import { SidebarNav } from '../components/layout/SidebarNav';
import { PixSettings } from '../components/settings/PixSettings';
import { SalesFieldDefinitions } from '../components/settings/SalesFieldDefinitions';
import { useCurrentUser, useUpdateInboxType } from '../hooks/useCurrentUser';
import { PRESS } from '../lib/interactions';
import type { InboxType } from '../types';

const INBOX_TYPE_OPTIONS: { value: InboxType; title: string; description: string }[] = [
  {
    value: 'SECTOR',
    title: 'Inbox por Setor',
    description: 'Organiza as conversas por setor/departamento da equipe. Padrão do Convitta.',
  },
  {
    value: 'SALES',
    title: 'Inbox para Vendas',
    description: 'Organiza as conversas com foco no fluxo comercial.',
  },
];

const INBOX_TYPE_LABEL: Record<InboxType, string> = {
  SECTOR: 'Inbox por Setor',
  SALES: 'Inbox para Vendas',
};

export function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateInboxType = useUpdateInboxType();

  const current = user?.inboxType ?? 'SECTOR';

  return (
    <div className="flex h-svh bg-paper text-ink">
      <SidebarNav active="settings" />

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-2xl font-semibold text-ink">Configurações</h1>
          <p className="mt-1 text-sm text-ink/50">Ajuste como o Convitta funciona para você.</p>

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">Tipo de Inbox</h2>
            <p className="mt-1 text-sm text-ink/50">
              Define o layout e as configurações do Inbox. O padrão é Inbox por Setor.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {INBOX_TYPE_OPTIONS.map((option) => {
                const isSelected = current === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isLoading || updateInboxType.isPending}
                    onClick={() => {
                      if (!isSelected) updateInboxType.mutate(option.value);
                    }}
                    aria-pressed={isSelected}
                    className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left disabled:opacity-60 ${PRESS} ${
                      isSelected ? 'border-signal bg-signal/10' : 'border-line bg-paper hover:bg-mist'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{option.title}</span>
                      {isSelected && <CheckIcon />}
                    </span>
                    <span className="text-xs text-ink/50">{option.description}</span>
                  </button>
                );
              })}
            </div>

            {updateInboxType.isError && (
              <p className="mt-3 text-sm text-stage-lost">Não foi possível salvar essa configuração. Tente novamente.</p>
            )}
          </section>

          <section className="mt-8 border-t border-line pt-8">
            <h2 className="font-display text-lg font-semibold text-ink">
              Configurações do {INBOX_TYPE_LABEL[current]}
            </h2>

            {current === 'SALES' ? (
              <>
                <p className="mt-1 text-sm text-ink/50">
                  Campos personalizados disponíveis para todos os contatos — cada contato preenche seu próprio valor
                  na aba lateral do chat.
                </p>
                <div className="mt-4">
                  <SalesFieldDefinitions />
                </div>

                <h3 className="mt-8 font-display text-base font-semibold text-ink">Pix</h3>
                <p className="mt-1 text-sm text-ink/50">
                  Configure sua chave Pix uma vez para poder enviar cobranças facilitadas em qualquer conversa.
                </p>
                <div className="mt-4">
                  <PixSettings />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink/50">Nenhuma configuração disponível para o Inbox por Setor ainda.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-signal" aria-hidden>
      <path d="M4 10.5 8 14l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
