export type ConversationStage = 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type WhatsappSessionStatus = 'PENDING_QR' | 'CONNECTED' | 'DISCONNECTED';

export type MessageMediaType = 'IMAGE' | 'STICKER' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'GIF';

/** Which Inbox layout/behavior the user sees — SECTOR (by department) is the default; SALES is
 * the sales-pipeline-oriented variant. Both render identically today; this is the seam future
 * per-mode Inbox components will branch on. */
export type InboxType = 'SECTOR' | 'SALES';

export type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

/** Free-shape business info the admin fills in for the AI — every field optional, no field
 * assumes a specific kind of business. */
export interface AiBusinessInfo {
  serviceAreas?: string[];
  paymentMethods?: string[];
  minOrderCents?: number;
  policies?: string[];
}

/** One weekly recurring window — `days` uses JS's own 0=domingo..6=sábado numbering, `start`/`end`
 * are "HH:mm" 24h. This is what the backend both validates a requested time against AND derives
 * the customer-facing "horário de funcionamento" display text from (see backend's
 * formatBusinessHoursDisplay) — no separate free-text field to keep in sync by hand. */
export interface AiBusinessHoursRange {
  days: number[];
  start: string;
  end: string;
}

/** One item in the admin's AI catalog — generic on purpose (product, service, or menu item). */
export interface AiCatalogItem {
  id: string;
  name: string;
  description: string | null;
  /** Free-text grouping (e.g. "Bebidas", "Marmitas") — lets the admin organize the catalog and
   * reference a group by name in a flow step's instructions, e.g. "ofereça algo da categoria
   * Bebidas se o pedido não tiver nenhuma". */
  category: string | null;
  priceCents: number;
  available: boolean;
  order: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  inboxType: InboxType;
  pixKey: string | null;
  pixKeyType: PixKeyType | null;
  pixMerchantName: string | null;
  pixMerchantCity: string | null;
  aiEnabled: boolean;
  aiBusinessName: string | null;
  aiPersona: string | null;
  aiBusinessInfo: AiBusinessInfo | null;
  aiBusinessHours: AiBusinessHoursRange[] | null;
  aiExtraRules: string | null;
  /** Account-wide default "Objetivo" — every conversation inherits this live unless it has its
   * own override (ConversationDetail.aiObjective). */
  aiDefaultObjective: string | null;
  aiFallbackMessage: string | null;
  aiMaxRepliesPerDay: number;
  aiCatalogItems: AiCatalogItem[];
}

export type AiFlowNodeType = 'TRIGGER' | 'AI_MESSAGE' | 'CONDITION' | 'TEXT' | 'END';

export type ConditionOperator = 'isSet' | 'isEmpty' | 'equals' | 'notEquals';

/** One rule inside a CONDITION node's config — evaluated in array order, first match wins. `field`
 * is either a ContactFieldDefinition key or one of the two reserved, code-computed signals
 * ("horarioValido", "neighborhoodConfirmed") the model itself is never allowed to decide on its
 * own. `targetEdgeLabel` must match an outgoing AiFlowEdge.routeLabel from the same node. */
export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value?: string;
  targetEdgeLabel: string;
}

export interface AiFlowNode {
  id: string;
  type: AiFlowNodeType;
  label: string;
  positionX: number;
  positionY: number;
  config: unknown;
}

export interface AiFlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  routeLabel: string | null;
  isFallback: boolean;
}

/** The account's conversation flow graph — see GET /ai-flow. Every account always has exactly
 * one; a brand new account gets the default TRIGGER → AI_MESSAGE → END graph auto-created. */
export interface AiFlow {
  id: string;
  name: string;
  nodes: AiFlowNode[];
  edges: AiFlowEdge[];
  /** Non-blocking configuration gaps (e.g. a CONDITION step with no fallback path) — never
   * prevents the flow from loading or saving, just worth the admin's attention. */
  warnings: string[];
}

export interface Contact {
  id: string;
  whatsappJid: string;
  name: string | null;
  phoneNumber: string;
  avatarUrl?: string | null;
  isGroup: boolean;
  /** Long-term facts the AI has learned about this person — plain text, one fact per line, only
   * ever grown/merged in code (see backend AiAutoReplyService), never edited by hand. */
  aiLongTermMemory: string | null;
}

/** A synced WhatsApp contact/group, whether or not a conversation with them has started yet. */
export interface ContactWithConversation extends Contact {
  conversationId: string | null;
  session: { id: string; label: string; status: WhatsappSessionStatus };
}

/** One participant's current reaction (emoji) to a message — at most one per participant, like
 * WhatsApp itself. `fromMe: true` (participantJid `"me"`) is always this app's own account. */
export interface MessageReaction {
  id: string;
  participantJid: string;
  fromMe: boolean;
  emoji: string;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: string | null;
  mediaType: MessageMediaType | null;
  mediaMimeType: string | null;
  mediaFileName: string | null;
  /** Who sent this within a group chat. Only ever set for inbound group messages — absent
   * entirely on responses that don't bother including it (e.g. right after sending). */
  sender?: Contact | null;
  /** Only populated on the conversation-detail response — absent (not empty) elsewhere. */
  reactions?: MessageReaction[];
  /** True only for outbound messages the AI auto-reply sent unattended. */
  isAiGenerated: boolean;
  createdAt: string;
}

export interface ConversationSession {
  id: string;
  label: string;
  phoneNumber: string | null;
  status: WhatsappSessionStatus;
}

export interface ConversationSummary {
  id: string;
  stage: ConversationStage;
  contact: Contact;
  session: ConversationSession;
  assigneeName: string | null;
  lastMessage: Message | null;
  tabId: string | null;
  /** Inbound messages received since this conversation was last opened. Reset to 0 by fetching
   * its detail (GET /conversations/:id) — see useConversation. */
  unreadCount: number;
  /** Per-conversation override of the account's global AI toggle — both must be true for the AI
   * to auto-reply here. */
  aiEnabled: boolean;
  /** Free-text note (admin- or AI-maintained) of what's still needed to close this deal. */
  aiObjective: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlowTraceEntry {
  at: string;
  nodeLabel: string;
  nodeType: string;
  note?: string;
}

/** Read-only "where is this conversation in the flow, and how did it get here" for the debug
 * panel — see GET /conversations/:id/flow-trace. `status: null` means the interpreter has never
 * run a turn for this conversation yet, same as sitting at the flow's TRIGGER node. */
export interface FlowTrace {
  status: 'RUNNING' | 'COMPLETED' | null;
  currentNodeId: string | null;
  currentNodeLabel: string | null;
  currentNodeType: AiFlowNodeType | null;
  trace: FlowTraceEntry[];
}

export interface ConversationDetail {
  id: string;
  stage: ConversationStage;
  contact: Contact;
  session: ConversationSession;
  assigneeName: string | null;
  messages: Message[];
  tabId: string | null;
  unreadCount: number;
  aiEnabled: boolean;
  aiObjective: string | null;
  /** The same recent-message window sent to the AI as context, formatted as readable text —
   * literally what the AI is currently seeing, not a separately-generated summary. */
  aiContextWindow: string;
  createdAt: string;
  updatedAt: string;
}

/** A custom-field key set up once in Configurações (Sales Inbox), shared across every contact —
 * e.g. "endereço". Managed in Settings, not per contact. */
export interface ContactFieldDefinition {
  id: string;
  key: string;
  createdAt: string;
  updatedAt: string;
}

/** One contact's value for a field definition — absent entirely if that contact never had this
 * field filled in. A future quick-message template feature will substitute {key} placeholders in
 * outgoing messages with a contact's matching field value. */
export interface ContactField {
  id: string;
  definitionId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSearchResult extends Message {
  conversationId: string;
  contact: Contact;
  session: ConversationSession;
}

export interface InboxSearchResults {
  chats: ConversationSummary[];
  messages: MessageSearchResult[];
}

export interface ContactTab {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappSession {
  id: string;
  label: string;
  phoneNumber: string | null;
  status: WhatsappSessionStatus;
  connectedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
