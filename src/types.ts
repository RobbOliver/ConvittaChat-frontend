export type ConversationStage = 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type WhatsappSessionStatus = 'PENDING_QR' | 'CONNECTED' | 'DISCONNECTED';

export interface Contact {
  id: string;
  whatsappJid: string;
  name: string | null;
  phoneNumber: string;
  avatarUrl?: string | null;
  isGroup: boolean;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: string | null;
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
  createdAt: string;
  updatedAt: string;
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
