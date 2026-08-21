import { FlowCanvas } from './FlowCanvas';

/**
 * The "Fluxo de IA" settings tab: just the editable conversation graph (see FlowCanvas's doc
 * comment). Account-wide AI settings (persona, horário, catálogo de regras, etc.) live in their
 * own "Configurações Gerais" tab (SettingsPage) instead of being bundled under this one.
 */
export function AiFlowTab() {
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-ink dark:text-[#ececed]">Fluxo da conversa</h3>
      <p className="mt-1 text-sm text-ink/50 dark:text-[#ececed]/50">
        Como a IA conduz o atendimento, passo a passo. Arraste, adicione e ligue passos no desenho
        abaixo — nada é salvo até você clicar em "Salvar fluxo".
      </p>
      <div className="mt-4">
        <FlowCanvas />
      </div>
    </div>
  );
}
