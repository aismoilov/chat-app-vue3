import { defineStore } from "pinia"
import { ref, reactive, computed } from "vue"
import type { Contact, Message } from "../types/chat"

export const useChatStore = defineStore("chat", () => {
  const contacts = ref<Contact[]>([])
  const messages = ref<Message[]>([])
  const selectedContact = ref<Contact | null>(null)
  const isTyping = ref(false)
  const unreadCounts = reactive<Record<string, number>>({})
  const connectionStatus = ref<"connected" | "disconnected" | "connecting">("disconnected")

  const mockContacts: Contact[] = [
    {
      id: "1",
      name: "Alice Johnson",
      status: "online",
      avatar: "",
      lastMessage: "Hey! How are you doing?",
      lastMessageTime: new Date(Date.now() - 300000),
    },
    {
      id: "2",
      name: "Bob Smith",
      status: "away",
      avatar: "",
      lastMessage: "Let's catch up tomorrow",
      lastMessageTime: new Date(Date.now() - 3600000),
    },
    {
      id: "3",
      name: "Carol Davis",
      status: "offline",
      avatar: "",
      lastMessage: "Thanks for the help!",
      lastMessageTime: new Date(Date.now() - 7200000),
    },
    {
      id: "4",
      name: "David Wilson",
      status: "online",
      avatar: "",
      lastMessage: "See you at the meeting",
      lastMessageTime: new Date(Date.now() - 86400000),
    },
    {
      id: "5",
      name: "Emma Brown",
      status: "online",
      avatar: "",
      lastMessage: "Great work on the project!",
      lastMessageTime: new Date(Date.now() - 172800000),
    },
    {
      id: "6",
      name: "Frank Miller",
      status: "away",
      avatar: "",
      lastMessage: "Can we reschedule?",
      lastMessageTime: new Date(Date.now() - 259200000),
    },
    {
      id: "7",
      name: "Grace Lee",
      status: "offline",
      avatar: "",
      lastMessage: "Happy birthday! 🎉",
      lastMessageTime: new Date(Date.now() - 345600000),
    },
    {
      id: "8",
      name: "Henry Taylor",
      status: "online",
      avatar: "",
      lastMessage: "The files are ready",
      lastMessageTime: new Date(Date.now() - 432000000),
    },
  ]

  const mockMessages: Message[] = [
    {
      id: "1",
      contactId: "1",
      content: "Hey! How are you doing?",
      timestamp: new Date(Date.now() - 300000),
      isOwn: false,
      status: "read",
    },
    {
      id: "2",
      contactId: "1",
      content: "I'm doing great! Just working on some new projects.",
      timestamp: new Date(Date.now() - 240000),
      isOwn: true,
      status: "read",
    },
    {
      id: "3",
      contactId: "1",
      content: "That sounds exciting! What kind of projects?",
      timestamp: new Date(Date.now() - 180000),
      isOwn: false,
      status: "read",
    },
    {
      id: "4",
      contactId: "1",
      content: "Mostly web development stuff. Building some chat applications with Vue 3!",
      timestamp: new Date(Date.now() - 120000),
      isOwn: true,
      status: "delivered",
    },
    {
      id: "5",
      contactId: "2",
      content: "Let's catch up tomorrow",
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
      status: "read",
    },
    {
      id: "6",
      contactId: "2",
      content: "Sounds good! What time works for you?",
      timestamp: new Date(Date.now() - 3540000),
      isOwn: true,
      status: "read",
    },
    {
      id: "7",
      contactId: "3",
      content: "Thanks for the help!",
      timestamp: new Date(Date.now() - 7200000),
      isOwn: false,
      status: "read",
    },
    {
      id: "8",
      contactId: "3",
      content: "You're welcome! Happy to help anytime.",
      timestamp: new Date(Date.now() - 7140000),
      isOwn: true,
      status: "read",
    },
  ]

  const selectedContactMessages = computed(() => {
    if (!selectedContact.value) return []
    return messages.value.filter((msg) => msg.contactId === selectedContact.value!.id)
  })

  const sortedContacts = computed(() => {
    return [...contacts.value].sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    })
  })

  const initializeMockData = () => {
    setContacts(mockContacts)
    setMessages(mockMessages)
  }

  const setContacts = (newContacts: Contact[]) => {
    contacts.value = newContacts
    newContacts.forEach((contact) => {
      if (!(contact.id in unreadCounts)) {
        unreadCounts[contact.id] = Math.floor(Math.random() * 3)
      }
    })
  }

  const setMessages = (newMessages: Message[]) => {
    messages.value = newMessages
  }

  const addMessage = (message: Message) => {
    messages.value.push(message)

    const contact = contacts.value.find((c) => c.id === message.contactId)
    if (contact) {
      contact.lastMessage = message.content
      contact.lastMessageTime = message.timestamp
    }

    if (!selectedContact.value || selectedContact.value.id !== message.contactId) {
      if (!message.isOwn) {
        unreadCounts[message.contactId] = (unreadCounts[message.contactId] || 0) + 1
      }
    }
  }

  const updateMessageStatus = (messageId: string, status: Message["status"]) => {
    const message = messages.value.find((m) => m.id === messageId)
    if (message) {
      message.status = status
    }
  }

  const selectContact = (contact: Contact) => {
    selectedContact.value = contact
    if (unreadCounts[contact.id]) {
      unreadCounts[contact.id] = 0
    }
  }

  const updateContactStatus = (contactId: string, status: Contact["status"]) => {
    const contact = contacts.value.find((c) => c.id === contactId)
    if (contact) {
      contact.status = status
    }
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  const setConnectionStatus = (status: "connected" | "disconnected" | "connecting") => {
    connectionStatus.value = status
  }

  return {
    contacts,
    messages,
    selectedContact,
    isTyping,
    unreadCounts,
    connectionStatus,
    selectedContactMessages,
    sortedContacts,
    initializeMockData,
    setContacts,
    setMessages,
    addMessage,
    updateMessageStatus,
    selectContact,
    updateContactStatus,
    setTyping,
    setConnectionStatus,
  }
})
