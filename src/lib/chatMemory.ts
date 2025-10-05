export type ChatRole = 'user' | 'model';

export interface Message {
  role: ChatRole;
  text: string;
}

// Simple in-memory store: sessionId -> messages
const sessionIdToMessages = new Map<string, Message[]>();

export function getSessionHistory(sessionId: string): Message[] {
  return sessionIdToMessages.get(sessionId) ?? [];
}

export function setSessionHistory(sessionId: string, messages: Message[]): void {
  sessionIdToMessages.set(sessionId, messages);
}

export function appendMessage(sessionId: string, message: Message, maxMessages: number = 10): Message[] {
  const existing = sessionIdToMessages.get(sessionId) ?? [];
  existing.push(message);
  // Keep only the last N messages to control memory growth
  const trimmed = existing.slice(-maxMessages);
  sessionIdToMessages.set(sessionId, trimmed);
  return trimmed;
}

export function clearSession(sessionId: string): void {
  sessionIdToMessages.delete(sessionId);
}

export function getLastNMessages(sessionId: string, n: number): Message[] {
  const history = getSessionHistory(sessionId);
  return history.slice(-n);
}


