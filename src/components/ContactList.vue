<template>
  <div class="h-full flex flex-col">
    <div class="p-4 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold text-gray-900">Messages</h1>
        <button 
          v-if="closeMobile !== undefined"
          @click="$emit('closeMobile')"
          class="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="relative">
        <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search conversations..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="space-y-1 p-2">
        <div
          v-for="contact in filteredContacts"
          :key="contact.id"
          @click="$emit('selectContact', contact)"
          :class="[
            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
            selectedContact?.id === contact.id 
              ? 'bg-blue-50 border border-blue-200' 
              : 'hover:bg-gray-50'
          ]"
        >
          <div class="relative">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {{ contact.name.charAt(0) }}
            </div>
            <span 
              :class="[
                'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white',
                contact.status === 'online' ? 'bg-green-500' : 
                contact.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
              ]"
            ></span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-900 truncate">{{ contact.name }}</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">
                  {{ formatTime(contact.lastMessageTime) }}
                </span>
                <div 
                  v-if="unreadCounts[contact.id] > 0"
                  class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {{ unreadCounts[contact.id] > 9 ? '9+' : unreadCounts[contact.id] }}
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 truncate mt-1">{{ contact.lastMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 bg-gray-50 border-t border-gray-200">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          You
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">Your Status</p>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            <span class="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Contact } from '../types/chat'

const props = defineProps<{
  contacts: Contact[]
  selectedContact: Contact | null
  unreadCounts: Record<string, number>
  closeMobile?: boolean
}>()

const emit = defineEmits<{
  selectContact: [contact: Contact]
  closeMobile: []
}>()

const searchQuery = ref('')

const filteredContacts = computed(() => {
  if (!searchQuery.value) return props.contacts
  return props.contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
