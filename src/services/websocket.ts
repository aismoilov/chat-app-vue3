import type { Contact, Message, WebSocketMessage } from "../types/chat"

export class WebSocketMock {
  private listeners: Map<string, Function[]> = new Map()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageSimulationInterval: NodeJS.Timeout | null = null

  constructor() {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emit("connecting")

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
    })
  }

  disconnect(): void {
    this.isConnected = false
    this.stopHeartbeat()
    this.stopMessageSimulation()
    this.emit("disconnected")
  }

  send(message: WebSocketMessage): void {
    if (!this.isConnected) {
      return
    }

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
        if (Math.random() > 0.98) {
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
    const messages = [
      "Hey there!",
      "How's your day going?",
      "Just wanted to check in.",
      "Are you free to chat?",
      "Hope you're doing well!",
      "What are you up to?",
      "Long time no see!",
      "Thanks for earlier!",
      "Did you see the news?",
      "Let's catch up soon!",
    ]

    const message: Message = {
      id: Date.now().toString(),
      contactId,
      content: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(),
      isOwn: false,
      status: "read",
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

export const websocketService = new WebSocketMock()
