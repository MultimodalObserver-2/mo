export type ServerConfig = {
  port_tcp: number
  port_udp: number
}

export type ClientInfo = {
  id: string
  ip: string
  capture_plugins: string[]
}

export type ServerStatus = {
  online: boolean
  local_ip?: string
  port_tcp?: number
  port_udp?: number
  clients: ClientInfo[]
}

export type ChatMessage = {
  timestamp: number
  name: string
  content: string
  from_server: boolean
}

export type ChatMessageSend = {
  name: string
  content: string
}

export type NoteMessage = {
  timestamp: number
  name: string
  content: string
  time_begin: number
  time_end: number
}

// WebSocket events
export type WsEvent =
  | { event: "client_connected"; payload: { id: string; ip: string } }
  | { event: "client_disconnected"; payload: { id: string; ip: string } }
  | { event: "chat_message"; payload: ChatMessage }
  | { event: "note_received"; payload: NoteMessage }
  | { event: "streaming_stopped"; payload: { id: string } }
  | { event: "streaming_quality_changed"; payload: Record<string, unknown> }
  | { event: "unknown_command"; payload: Record<string, unknown> }
