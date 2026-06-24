import axios, { API_PORT } from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import { ChatMessage, ChatMessageSend, NoteMessage, ServerConfig, ServerStatus } from "../types/Communication"

class CommunicationService {
  readonly serverEndpoint = "/communication/server"
  readonly chatEndpoint = "/communication/chat"
  readonly notesEndpoint = "/communication/notes"

  // --- Server ---

  async startServer(config: ServerConfig): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.serverEndpoint}/start`, config)
  }

  async stopServer(): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.serverEndpoint}/stop`)
  }

  async getStatus(): Promise<AxiosResponse<ServerStatus, unknown>> {
    return axios.get(`${this.serverEndpoint}/status`)
  }

  // --- Chat ---

  async sendMessage(message: ChatMessageSend): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`${this.chatEndpoint}/send`, message)
  }

  async getChatHistory(): Promise<AxiosResponse<ChatMessage[], unknown>> {
    return axios.get(`${this.chatEndpoint}/history`)
  }

  // --- Notes ---

  async getNotesHistory(): Promise<AxiosResponse<NoteMessage[], unknown>> {
    return axios.get(`${this.notesEndpoint}/history`)
  }

  // --- WebSocket ---

  openWebSocket(onMessage: (event: MessageEvent) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:${API_PORT}/communication/server/ws`)
    ws.onmessage = onMessage
    return ws
  }
}

const communicationService = new CommunicationService()
export default communicationService
