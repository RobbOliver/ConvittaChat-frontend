import type { Conversation } from '../types';

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    stage: 'IN_PROGRESS',
    assigneeName: 'Robson',
    contact: { id: 'ct1', name: 'Maria Silva', phoneNumber: '+55 11 98888-1111' },
    messages: [
      { id: 'm1', direction: 'INBOUND', content: 'Oi, quero saber sobre o produto X', createdAt: '2026-08-09T10:02:00' },
      { id: 'm2', direction: 'OUTBOUND', content: 'Claro! Deixa eu te explicar os planos disponíveis.', createdAt: '2026-08-09T10:03:00' },
      { id: 'm3', direction: 'INBOUND', content: 'Perfeito, pode mandar os valores?', createdAt: '2026-08-09T10:05:00' },
    ],
  },
  {
    id: 'c2',
    stage: 'NEW',
    assigneeName: null,
    contact: { id: 'ct2', name: 'João Pereira', phoneNumber: '+55 21 97777-2222' },
    messages: [
      { id: 'm4', direction: 'INBOUND', content: 'Boa tarde, vocês fazem entrega para SP?', createdAt: '2026-08-09T09:40:00' },
    ],
  },
  {
    id: 'c3',
    stage: 'WON',
    assigneeName: 'Robson',
    contact: { id: 'ct3', name: 'Ana Costa', phoneNumber: '+55 31 96666-3333' },
    messages: [
      { id: 'm5', direction: 'OUTBOUND', content: 'Seu pedido foi confirmado, obrigado pela preferência!', createdAt: '2026-08-08T17:20:00' },
      { id: 'm6', direction: 'INBOUND', content: 'Show, muito obrigada! 🙌', createdAt: '2026-08-08T17:22:00' },
    ],
  },
];
