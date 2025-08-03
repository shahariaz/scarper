/**
 * Messaging Service - Frontend API for real-time messaging
 */

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reply_to?: number;
  is_read: boolean;
  is_deleted: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  sender?: User;
  reply_to_message?: Message;
}

export interface Conversation {
  id: number;
  participants: User[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at?: string;
  is_group: boolean;
  group_name?: string;
  group_description?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  pages: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  pages: number;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  reply_to?: number;
  metadata?: Record<string, unknown>;
}

export interface DirectMessageRequest {
  user_id: number;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
}

export interface SearchMessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  pages: number;
  query: string;
}

export interface UnreadCountsResponse {
  total_unread: number;
  conversations: Record<number, number>;
}

class MessagingService {
  /**
   * Get user's conversations with pagination
   */
  async getConversations(page: number = 1, limit: number = 20): Promise<ApiResponse<ConversationsResponse>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Start a new conversation with a user
   */
  async startConversation(userId: number): Promise<ApiResponse<{ conversation_id: number; created: boolean }>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });
    return response.json();
  }

  /**
   * Get messages from a specific conversation
   */
  async getConversationMessages(
    conversationId: number, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ApiResponse<MessagesResponse>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: number, 
    messageData: SendMessageRequest
  ): Promise<ApiResponse<{ message: Message; participants: number[] }>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations/${conversationId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    return response.json();
  }

  /**
   * Send a direct message to a user (creates conversation if needed)
   */
  async sendDirectMessage(messageData: DirectMessageRequest): Promise<ApiResponse<{
    message: Message;
    conversation_id: number;
    conversation_created: boolean;
  }>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/send-to-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    return response.json();
  }

  /**
   * Mark messages in a conversation as read
   */
  async markConversationRead(
    conversationId: number, 
    upToMessageId?: number
  ): Promise<ApiResponse<{ marked_count: number }>> {
    const data = upToMessageId ? { up_to_message_id: upToMessageId } : {};
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations/${conversationId}/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * Get unread message counts
   */
  async getUnreadCounts(): Promise<ApiResponse<UnreadCountsResponse>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/unread-counts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Search messages across conversations or within a specific conversation
   */
  async searchMessages(
    query: string,
    conversationId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<SearchMessagesResponse>> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (conversationId) {
      params.append('conversation_id', conversationId.toString());
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/messages/${messageId}/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Get detailed information about a conversation
   */
  async getConversationInfo(conversationId: number): Promise<ApiResponse<{
    conversation: Conversation;
    participants: User[];
    message_count: number;
    last_activity: string;
  }>> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/messaging/conversations/${conversationId}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  /**
   * Format message timestamp for display
   */
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Format conversation last message preview
   */
  formatLastMessagePreview(message: Message): string {
    if (message.is_deleted) return 'Message deleted';
    
    const maxLength = 50;
    const content = message.content.length > maxLength 
      ? `${message.content.substring(0, maxLength)}...`
      : message.content;
    
    if (message.message_type === 'image') return '📷 Image';
    if (message.message_type === 'file') return '📎 File';
    if (message.message_type === 'system') return content;
    
    return content;
  }

  /**
   * Get display name for a user
   */
  getUserDisplayName(user: User): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  }

  /**
   * Get conversation display name
   */
  getConversationDisplayName(conversation: Conversation, currentUserId: number): string {
    if (conversation.is_group) {
      return conversation.group_name || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    return otherParticipant ? this.getUserDisplayName(otherParticipant) : 'Unknown User';
  }

  /**
   * Get conversation avatar URL
   */
  getConversationAvatar(conversation: Conversation, currentUserId: number): string | undefined {
    if (conversation.is_group) {
      return undefined; // Use default group avatar
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    return otherParticipant?.profile_image;
  }
}

export const messagingService = new MessagingService();
