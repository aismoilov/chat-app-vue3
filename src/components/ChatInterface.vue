<template>
  <div class="flex-1 flex flex-col h-full">
    <div v-if="selectedContact" class="hidden lg:flex items-center gap-3 p-4 bg-white border-b border-gray-200">
      <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
        {{ selectedContact.name.charAt(0) }}
      </div>
      <div class="flex-1">
        <h3 class="font-medium text-gray-900">{{ selectedContact.name }}</h3>
        <p class="text-sm text-gray-500 flex items-center gap-2">
          <span 
            :class="[
              'w-2 h-2 rounded-full',
              selectedContact.status === 'online' ? 'bg-green-500' : 
              selectedContact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
            ]"
          ></span>
          {{ selectedContact.status.charAt(0).toUpperCase() + selectedContact.status.slice(1) }}
        </p>
      </div>
    </div>

    <div 
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 chat-messages bg-gray-50"
    >
      <div v-if="!selectedContact" class="flex items-center justify-center h-full text-gray-500">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-lg font-medium">Select a conversation</p>
          <p class="text-sm">Choose a contact to start messaging</p>
        </div>
      </div>

      <div v-else>
        <div
          v-for="message in filteredMessages"
          :key="message.id"
          :class="[
            'flex',
            message.isOwn ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
              message.isOwn 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
            ]"
          >
            <p class="text-sm">{{ message.content }}</p>
            <div class="flex items-center justify-between mt-1 gap-2">
              <span 
                :class="[
                  'text-xs',
                  message.isOwn ? 'text-blue-100' : 'text-gray-500'
                ]"
              >
                {{ formatTime(message.timestamp) }}
              </span>
              <div v-if="message.isOwn" class="flex items-center">
                <svg 
                  v-if="message.status === 'sent'"
                  class="w-4 h-4 text-blue-200" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <svg 
                  v-else-if="message.status === 'delivered'"
                  class="w-4 h-4 text-blue-200" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  <path fill-rule="evenodd" d="M19.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <svg 
                  v-else
                  class="w-4 h-4 text-blue-300" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  <path fill-rule="evenodd" d="M19.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isTyping" class="flex justify-start">
          <div class="bg-white text-gray-900 rounded-lg rounded-bl-sm shadow-sm px-4 py-2">
            <div class="flex items-center gap-1">
              <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
              <span class="text-xs text-gray-500 ml-2">{{ selectedContact.name }} is typing...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedContact" class="p-4 bg-white border-t border-gray-200">
      <form @submit.prevent="handleSendMessage" class="flex items-end gap-3">
        <div class="flex-1">
          <textarea
            v-model="newMessage"
            @keydown.enter.exact.prevent="handleSendMessage"
            @keydown.enter.shift.exact="newMessage += '\n'"
            placeholder="Type a message..."
            rows="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
          ></textarea>
        </div>
        <button
          type="submit"
          :disabled="!newMessage.trim()"
          :class="[
            'p-2 rounded-lg transition-colors',
            newMessage.trim() 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { Contact, Message } from '../types/chat'

const props = defineProps<{
  selectedContact: Contact | null
  messages: Message[]
  isTyping: boolean
}>()

const emit = defineEmits<{
  sendMessage: [content: string]
}>()

const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()

const filteredMessages = computed(() => {
  if (!props.selectedContact) return []
  return props.messages.filter(msg => msg.contactId === props.selectedContact!.id)
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const handleSendMessage = () => {
  if (!newMessage.value.trim()) return
  
  emit('sendMessage', newMessage.value)
  newMessage.value = ''
  
  nextTick(() => {
    scrollToBottom()
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => props.messages.length, () => {
  nextTick(() => {
    scrollToBottom()
  })
})

watch(() => props.selectedContact, () => {
  nextTick(() => {
    scrollToBottom()
  })
})
</script>
