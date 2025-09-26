<template>
  <div class="h-screen bg-gray-100 flex">
    <div 
      v-if="chatStore.connectionStatus !== 'connected'"
      class="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium"
      :class="connectionStatusClass"
    >
      {{ connectionStatusText }}
    </div>

    <div 
      v-if="showMobileContacts"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
      @click="showMobileContacts = false"
    >
      <div 
        class="w-80 h-full bg-white shadow-lg transform transition-transform"
        @click.stop
      >
        <ContactList 
          :contacts="chatStore.sortedContacts"
          :selected-contact="chatStore.selectedContact"
          :unread-counts="chatStore.unreadCounts"
          @select-contact="handleSelectContact"
          @close-mobile="showMobileContacts = false"
        />
      </div>
    </div>

    <div class="hidden lg:block w-80 bg-white border-r border-gray-200">
      <ContactList 
        :contacts="chatStore.sortedContacts"
        :selected-contact="chatStore.selectedContact"
        :unread-counts="chatStore.unreadCounts"
        @select-contact="handleSelectContact"
      />
    </div>

    <div class="flex-1 flex flex-col">
      <div class="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <button 
          @click="showMobileContacts = true"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div v-if="chatStore.selectedContact" class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {{ chatStore.selectedContact.name.charAt(0) }}
          </div>
          <div>
            <h3 class="font-medium text-gray-900">{{ chatStore.selectedContact.name }}</h3>
            <p class="text-xs text-gray-500 flex items-center gap-1">
              <span 
                :class="[
                  'w-1.5 h-1.5 rounded-full',
                  chatStore.selectedContact.status === 'online' ? 'bg-green-500' : 
                  chatStore.selectedContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                ]"
              ></span>
              {{ chatStore.selectedContact.status }}
            </p>
          </div>
        </div>
      </div>

      <ChatInterface 
        :selected-contact="chatStore.selectedContact"
        :messages="chatStore.selectedContactMessages"
        :is-typing="chatStore.isTyping"
        @send-message="handleSendMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useChatStore } from './stores/chat'
import { websocketService } from './services/websocket'
import ContactList from './components/ContactList.vue'
import ChatInterface from './components/ChatInterface.vue'
import type { Contact, Message, WebSocketMessage } from './types/chat'

const chatStore = useChatStore()
const showMobileContacts = ref(false)

const connectionStatusClass = computed(() => {
  return chatStore.connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
})

const connectionStatusText = computed(() => {
  return chatStore.connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'
})

const handleSelectContact = (contact: Contact) => {
  chatStore.selectContact(contact)
  showMobileContacts.value = false
  
  if (Math.random() > 0.7) {
    chatStore.setTyping(true)
    setTimeout(() => {
      chatStore.setTyping(false)
    }, 2000 + Math.random() * 3000)
  }
}

const handleSendMessage = (content: string) => {
  if (!chatStore.selectedContact) return
  
  const newMessage: Message = {
    id: Date.now().toString(),
    contactId: chatStore.selectedContact.id,
    content,
    timestamp: new Date(),
    isOwn: true,
    status: 'sent'
  }
  
  chatStore.addMessage(newMessage)
  
  const wsMessage: WebSocketMessage = {
    type: 'message',
    data: newMessage,
    timestamp: new Date()
  }
  
  websocketService.send(wsMessage)
}

const setupWebSocketListeners = () => {
  websocketService.on('connecting', () => {
    chatStore.setConnectionStatus('connecting')
  })

  websocketService.on('connected', () => {
    chatStore.setConnectionStatus('connected')
  })

  websocketService.on('disconnected', () => {
    chatStore.setConnectionStatus('disconnected')
  })

  websocketService.on('message', (message: Message) => {
    chatStore.addMessage(message)
  })

  websocketService.on('message_status', (data: { messageId: string, status: Message['status'] }) => {
    chatStore.updateMessageStatus(data.messageId, data.status)
  })

  websocketService.on('typing_start', (data: { contactId: string }) => {
    if (chatStore.selectedContact?.id === data.contactId) {
      chatStore.setTyping(true)
    }
  })

  websocketService.on('typing_stop', (data: { contactId: string }) => {
    if (chatStore.selectedContact?.id === data.contactId) {
      chatStore.setTyping(false)
    }
  })

  websocketService.on('presence_update', (data: { contactId: string, status: Contact['status'] }) => {
    chatStore.updateContactStatus(data.contactId, data.status)
  })
}

onMounted(async () => {
  chatStore.initializeMockData()
  
  setupWebSocketListeners()
  
  try {
    await websocketService.connect()
  } catch (error) {
    console.error('[v0] Failed to connect to WebSocket:', error)
  }
})

onUnmounted(() => {
  websocketService.disconnect()
})
</script>

<style>
.chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f7fafc;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
