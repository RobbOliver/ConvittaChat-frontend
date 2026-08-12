import { AiSettings } from '../AiSettings';
import { FlowCanvas } from './FlowCanvas';

/**
 * The "Fluxo de IA" settings tab: a preview of the conversation graph (read-only for now — see
 * FlowCanvas's doc comment) plus the account-wide AI settings, which still apply to every node
 * (persona, horário, catálogo de regras, etc.) rather than being per-node config. AiSettings
 * itself is unchanged, just relocated here from the old flat settings page.
 */
export function AiFlowTab() {
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-ink">Fluxo da conversa</h3>
      <p className="mt-1 text-sm text-ink/50">
        Como a IA conduz o atendimento, passo a passo. Por enquanto o fluxo é só uma prévia — editar
        o desenho (arrastar, adicionar e ligar novos passos) chega em breve.
      </p>
      <div className="mt-4">
        <FlowCanvas />
      </div>

      <h3 className="mt-10 font-display text-base font-semibold text-ink">Configurações gerais</h3>
      <p className="mt-1 text-sm text-ink/50">
        Persona, horário e regras de segurança valem para todos os passos do fluxo acima.
      </p>
      <div className="mt-4">
        <AiSettings />
      </div>
    </div>
  );
}
