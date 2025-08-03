'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { MessageCircle, X, Send, Search, Users, Settings, Phone, Video } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { messagingService } from '../../services/messaging'

interface MessagingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Conversation {
  id: number
  participants: Array<{
    id: number
    email: string
    first_name?: string
    last_name?: string
  }>
  last_message?: {
    id: number
    content: string
    created_at: string
    sender_id: number
  }
  unread_count: number
}

interface Message {
  id: number
  content: string
  sender_id: number
  created_at: string
  is_read: boolean
}

export default function MessagingModal({ isOpen, onClose }: MessagingModalProps) {
  const { user } = useSelector((state: RootState) => state.auth)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      loadConversations()
    }
  }, [isOpen, user])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const result = await messagingService.getConversations(1, 20)
      if (result.success) {
        setConversations(result.data?.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      const result = await messagingService.getConversationMessages(conversationId, 1, 50)
      if (result.success) {
        setMessages(result.data?.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const result = await messagingService.sendMessage(selectedConversation, {
        content: newMessage.trim(),
        message_type: 'text'
      })
      
      if (result.success) {
        setNewMessage('')
        loadMessages(selectedConversation)
        loadConversations() // Refresh to update last message
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const selectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId)
    loadMessages(conversationId)
  }

  const getConversationName = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find(p => p.id !== user?.id)
    if (otherParticipant) {
      return `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || otherParticipant.email
    }
    return 'Unknown User'
  }

  const getUserInitials = (userId: number) => {
    if (userId === user?.id) {
      return user.first_name?.[0] || user.email?.[0] || 'U'
    }
    
    const conversation = conversations.find(c => c.participants.some(p => p.id === userId))
    const participant = conversation?.participants.find(p => p.id === userId)
    if (participant) {
      return `${participant.first_name?.[0] || ''}${participant.last_name?.[0] || ''}`.trim() || participant.email?.[0] || 'U'
    }
    return 'U'
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Messages</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white h-8 w-8 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(600px-80px)]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start messaging someone to see conversations here</p>
                </div>
              ) : (
                conversations
                  .filter(conv => 
                    searchTerm === '' || 
                    getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation.id)}
                      className={`p-3 border-b border-gray-700/50 cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-yellow-400/10 border-yellow-400/20'
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 text-sm font-semibold">
                              {getUserInitials(conversation.participants.find(p => p.id !== user?.id)?.id || 0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white truncate">
                              {getConversationName(conversation)}
                            </p>
                            {conversation.last_message && (
                              <span className="text-xs text-gray-400">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-400 truncate">
                              {conversation.last_message?.content || 'No messages yet'}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 text-sm font-semibold">
                        {getUserInitials(conversations.find(c => c.id === selectedConversation)?.participants.find(p => p.id !== user?.id)?.id || 0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getConversationName(conversations.find(c => c.id === selectedConversation)!)}
                      </p>
                      <p className="text-xs text-gray-400">Active now</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 w-8">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages in this conversation</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user?.id ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 h-10 w-10 rounded-lg"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
