import { io } from 'socket.io-client';
import { getToken } from './authToken';

export const socket = io(import.meta.env.VITE_WS_URL ?? 'http://localhost:3000', {
  autoConnect: false,
  auth: (callback) => callback({ token: getToken() }),
});

export function connectSocket(): void {
  if (!socket.connected) socket.connect();
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect();
}
