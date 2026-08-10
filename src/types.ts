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

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  inboxType: InboxType;
  pixKey: string | null;
  pixKeyType: PixKeyType | null;
  pixMerchantName: string | null;
  pixMerchantCity: string | null;
}

export interface Contact {
  id: string;
  whatsappJid: string;
  name: string | null;
  phoneNumber: string;
  avatarUrl?: string | null;
  isGroup: boolean;
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
  createdAt: string;
  updatedAt: string;
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
