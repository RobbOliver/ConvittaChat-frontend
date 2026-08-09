export type ConversationStage = 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  stage: ConversationStage;
  contact: Contact;
  assigneeName: string | null;
  messages: Message[];
}
