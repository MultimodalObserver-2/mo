export interface ConnectionConfig {
  ip: string
  port: number
  name: string
}

export interface ConnectionStatus {
  connected: boolean
  server_ip: string | null
  server_port: number | null
  name: string | null
  udp_active: boolean
  capture_plugins: string[]
}

export interface ClientChatMessage {
  timestamp: number
  name: string
  content: string
  from_server: boolean
}

export interface ClientNoteSend {
  content: string
  time_begin: number
  time_end: number
}

export interface ClientNoteMessage {
  timestamp: number
  name: string
  content: string
  time_begin: number
  time_end: number
}

export type ClientWsEvent =
  | { type: 'disconnected' }
  | { type: 'chat_message'; message: ClientChatMessage }
  | { type: 'note_received'; note: ClientNoteMessage }
  | { type: 'capture_plugins_updated'; capture_plugins: string[] }
  | { type: 'streaming_data'; data: unknown }
  | { type: 'server_event'; data: unknown }
