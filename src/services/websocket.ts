import type { Contact, Message, WebSocketMessage, RealWebSocketMessage, WebSocketConfig } from "../types/chat"

export class WebSocketService {
  private listeners: Map<string, Function[]> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageSimulationInterval: NodeJS.Timeout | null = null
  private websocket: WebSocket | null = null
  private config: WebSocketConfig

  constructor(config: WebSocketConfig = { useRealServer: false, serverUrl: "" }) {
    this.config = config
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emit("connecting")

      if (this.config.useRealServer) {
        this.connectToRealServer(resolve, reject)
      } else {
        this.connectToMockServer(resolve, reject)
      }
    })
  }

  private connectToRealServer(resolve: Function, reject: Function): void {
    try {
      this.websocket = new WebSocket(this.config.serverUrl)

      this.websocket.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit("connected")
        this.startHeartbeat()
        resolve()
      }

      this.websocket.onmessage = (event) => {
        try {
          const data: RealWebSocketMessage = JSON.parse(event.data)
          console.log("Received WebSocket message:", data)
          this.handleRealServerMessage(data)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.websocket.onclose = () => {
        this.isConnected = false
        this.websocket = null
        this.handleConnectionError()
      }

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
        reject(new Error("WebSocket connection failed"))
      }
    } catch (error) {
      reject(error)
    }
  }

  private handleRealServerMessage(data: RealWebSocketMessage): void {
    const message: Message = {
      id: data.id,
      contactId: data.contactId,
      content: data.content,
      timestamp: new Date(data.timestamp),
      isOwn: data.isOwn,
      status: data.status,
    }

    this.emit("message", message)
  }

  private connectToMockServer(resolve: Function, reject: Function): void {
    setTimeout(
      () => {
        if (Math.random() > 0.1) {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.emit("connected")
          this.startHeartbeat()
          this.startMessageSimulation()
          resolve()
        } else {
          this.handleConnectionError()
          reject(new Error("Connection failed"))
        }
      },
      1000 + Math.random() * 2000,
    )
  }

  disconnect(): void {
    this.isConnected = false
    this.stopHeartbeat()
    this.stopMessageSimulation()

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    this.emit("disconnected")
  }

  send(message: WebSocketMessage): void {
    if (!this.isConnected) {
      return
    }

    if (this.config.useRealServer && this.websocket) {
      this.websocket.send(JSON.stringify(message))
    } else {
      setTimeout(
        () => {
          if (message.type === "message") {
            this.emit("message_status", {
              messageId: message.data.id,
              status: "delivered",
            })

            setTimeout(
              () => {
                this.emit("message_status", {
                  messageId: message.data.id,
                  status: "read",
                })
              },
              2000 + Math.random() * 3000,
            )

            if (Math.random() > 0.3) {
              this.simulateIncomingMessage(message.data.contactId)
            }
          }
        },
        500 + Math.random() * 1000,
      )
    }
  }

  setConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config }
    if (this.isConnected) {
      this.disconnect()
      setTimeout(() => this.connect(), 1000)
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => callback(data))
    }
  }

  private handleConnectionError(): void {
    this.isConnected = false
    this.emit("disconnected")

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

      this.reconnectInterval = setTimeout(() => {
        this.connect().catch(() => {})
      }, delay)
    } else {
      this.emit("max_reconnect_attempts_reached")
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        if (!this.config.useRealServer && Math.random() > 0.98) {
          this.handleConnectionError()
        }
      }
    }, 30000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private startMessageSimulation(): void {
    if (this.config.useRealServer) return

    this.messageSimulationInterval = setInterval(() => {
      if (!this.isConnected) return

      if (Math.random() > 0.95) {
        const contactIds = ["1", "2", "3", "4", "5", "6", "7", "8"]
        const randomContactId = contactIds[Math.floor(Math.random() * contactIds.length)]
        this.simulateIncomingMessage(randomContactId)
      }

      if (Math.random() > 0.97) {
        const contactIds = ["1", "2", "3", "4", "5", "6", "7", "8"]
        const randomContactId = contactIds[Math.floor(Math.random() * contactIds.length)]
        this.simulateTyping(randomContactId)
      }

      if (Math.random() > 0.96) {
        this.simulatePresenceUpdate()
      }
    }, 5000)
  }

  private stopMessageSimulation(): void {
    if (this.messageSimulationInterval) {
      clearInterval(this.messageSimulationInterval)
      this.messageSimulationInterval = null
    }
  }

  private simulateIncomingMessage(contactId: string): void {
    const message: Message = {
      id: crypto.randomUUID(),
      contactId: crypto.randomUUID(),
      content: `Random message at ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      isOwn: Math.random() > 0.5,
      status: "sent"
    }

    this.emit("message", message)
  }

  private simulateTyping(contactId: string): void {
    this.emit("typing_start", { contactId })

    setTimeout(
      () => {
        this.emit("typing_stop", { contactId })
      },
      2000 + Math.random() * 3000,
    )
  }

  private simulatePresenceUpdate(): void {
    const contactIds = ["1", "2", "3", "4", "5", "6", "7", "8"]
    const statuses: Contact["status"][] = ["online", "away", "offline"]

    const randomContactId = contactIds[Math.floor(Math.random() * contactIds.length)]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    this.emit("presence_update", {
      contactId: randomContactId,
      status: randomStatus,
    })
  }
}

export const websocketService = new WebSocketService()
