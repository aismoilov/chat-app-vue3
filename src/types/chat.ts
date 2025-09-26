export interface Contact {
  id: string
  name: string
  status: "online" | "offline" | "away"
  avatar: string
  lastMessage: string
  lastMessageTime: Date
}

export interface Message {
  id: string
  contactId: string
  content: string
  timestamp: Date
  isOwn: boolean
  status: "sent" | "delivered" | "read"
}

export interface WebSocketMessage {
  type: "message" | "typing" | "status" | "presence"
  data: any
  timestamp: Date
}
