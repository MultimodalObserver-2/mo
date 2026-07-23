import api, { API_PORT } from '@renderer/core/lib/axios'
import type {
  ClientChatMessage,
  ClientNoteMessage,
  ClientNoteSend,
  ClientWsEvent,
  ConnectionConfig,
  ConnectionStatus
} from '../types/Client'

const BASE = '/client'

const ClientService = {
  connect: (config: ConnectionConfig) => api.post(`${BASE}/connect`, config),

  disconnect: () => api.post(`${BASE}/disconnect`),

  getStatus: (): Promise<{ data: ConnectionStatus }> => api.get(`${BASE}/status`),

  sendChat: (content: string) => api.post(`${BASE}/chat/send`, { content }),

  getChatHistory: (): Promise<{ data: ClientChatMessage[] }> => api.get(`${BASE}/chat/history`),

  sendNote: (payload: ClientNoteSend) => api.post(`${BASE}/notes/send`, payload),

  getNotesHistory: (): Promise<{ data: ClientNoteMessage[] }> => api.get(`${BASE}/notes/history`),

  openWebSocket: (onEvent: (event: ClientWsEvent) => void, onClose?: () => void): WebSocket => {
    const ws = new WebSocket(`ws://127.0.0.1:${API_PORT}${BASE}/ws`)
    ws.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data) as ClientWsEvent)
      } catch {
        // ignore malformed messages
      }
    }
    ws.onclose = onClose ?? (() => {})
    return ws
  }
}

export default ClientService
