"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical, 
  Phone,
  Video,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  Users
} from 'lucide-react';
import { 
  messagingService, 
  Conversation, 
  Message
} from '../../services/messaging';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_following?: boolean;
}

interface MessagingWidgetProps {
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function MessagingWidget({ 
  className, 
  isFullscreen = false, 
  onToggleFullscreen 
}: MessagingWidgetProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messagingService.getConversations(1, 20);
      if (response.success && response.data) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const response = await messagingService.getUnreadCounts();
      if (response.success && response.data) {
        setUnreadCounts(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load unread counts:', error);
    }
  };

  const loadFollowingUsers = useCallback(async () => {
    try {
      // Mock API call - replace with actual social service
      const mockFollowing: User[] = [
        { id: 9, email: 'admin@gmail.com', first_name: 'Admin', last_name: 'User', is_following: true },
        { id: 2, email: 'user@example.com', first_name: 'John', last_name: 'Doe', is_following: true },
      ];
      setFollowingUsers(mockFollowing);
    } catch (error) {
      console.error('Failed to load following users:', error);
    }
  }, []);

  const searchForUsers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearchingUsers(true);
    try {
      // Mock API call - replace with actual user search
      const mockResults: User[] = [
        { id: 9, email: 'admin@gmail.com', first_name: 'Admin', last_name: 'User' },
        { id: 3, email: 'test@example.com', first_name: 'Test', last_name: 'User' },
      ].filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchUsers(mockResults);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [searchQuery]);

  const startConversationWithUser = async (targetUser: User) => {
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        !conv.is_group && conv.participants?.some(p => p.id === targetUser.id)
      );
      
      if (existingConversation) {
        selectConversation(existingConversation);
        setActiveTab('conversations');
        return;
      }

      // Convert local User to messaging service User format
      const messagingUser: import('../../services/messaging').User = {
        id: targetUser.id,
        username: targetUser.email, // Use email as username for now
        email: targetUser.email,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name
      };

      const currentUser: import('../../services/messaging').User = {
        id: user?.id || 0,
        username: user?.email || '',
        email: user?.email || '',
        first_name: user?.first_name,
        last_name: user?.last_name
      };

      // For now, create a mock conversation since createConversation doesn't exist yet
      const newConversation: Conversation = {
        id: Date.now(), // Mock ID
        participants: [currentUser, messagingUser],
        is_group: false,
        last_message: undefined,
        unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setConversations(prev => [newConversation, ...prev]);
      selectConversation(newConversation);
      setActiveTab('conversations');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
    loadUnreadCounts();
    loadFollowingUsers();
  }, [loadFollowingUsers]);

  // Search users when query changes
  useEffect(() => {
    if (activeTab === 'users' && searchQuery.length > 2) {
      searchForUsers();
    } else {
      setSearchUsers([]);
    }
  }, [searchQuery, activeTab, searchForUsers]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (conversationId: number) => {
    setIsLoading(true);
    try {
      const response = await messagingService.getConversationMessages(conversationId, 1, 50);
      if (response.success && response.data) {
        setMessages(response.data.messages.reverse()); // Most recent at bottom
        // Mark conversation as read
        await messagingService.markConversationRead(conversationId);
        // Update unread counts
        setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await messagingService.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!.message]);
        setNewMessage('');
        
        // Update conversation list with new last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, last_message: response.data!.message }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return messagingService.formatMessageTime(timestamp);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const displayName = messagingService.getConversationDisplayName(conv, user?.id || 0);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
          {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
            </Badge>
          )}
        </CardTitle>
        {onToggleFullscreen && (
          <Button variant="ghost" size="sm" onClick={onToggleFullscreen}>
            {isFullscreen ? 'Minimize' : 'Expand'}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className={cn(
            "border-r flex flex-col",
            isFullscreen ? "w-80" : "w-64"
          )}>
            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === 'conversations' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('conversations')}
              >
                <MessageCircle className="inline h-4 w-4 mr-2" />
                Chats
              </button>
              <button
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === 'users' 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('users')}
              >
                <Users className="inline h-4 w-4 mr-2" />
                People
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === 'conversations' ? "Search conversations..." : "Search people..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 p-2">
                {activeTab === 'conversations' ? (
                  // Conversations Tab
                  <>
                    {isLoading && conversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading conversations...
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                      </div>
                    ) : (
                      filteredConversations.map((conversation) => {
                        const displayName = messagingService.getConversationDisplayName(conversation, user?.id || 0);
                        const avatarUrl = messagingService.getConversationAvatar(conversation, user?.id || 0);
                        const unreadCount = unreadCounts[conversation.id] || 0;
                        const isSelected = selectedConversation?.id === conversation.id;

                        return (
                          <div
                            key={conversation.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                              isSelected && "bg-muted"
                            )}
                            onClick={() => selectConversation(conversation)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {conversation.is_group ? '👥' : getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{displayName}</h4>
                            {conversation.last_message && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          
                          {conversation.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                              {messagingService.formatLastMessagePreview(conversation.last_message)}
                            </p>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="rounded-full min-w-[20px] h-5 text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
                  </>
                ) : (
                  // Users Tab
                  <>
                    {/* Following Section */}
                    {followingUsers.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Following</h3>
                        {followingUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => startConversationWithUser(user)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(`${user.first_name} ${user.last_name}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search Results */}
                    {searchQuery.length > 2 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Search Results</h3>
                        {isSearchingUsers ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Searching...
                          </div>
                        ) : searchUsers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No users found
                          </div>
                        ) : (
                          searchUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => startConversationWithUser(user)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getInitials(`${user.first_name} ${user.last_name}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.email}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Empty State */}
                    {searchQuery.length <= 2 && followingUsers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start following people to message them</p>
                        <p className="text-sm mt-1">Use the search above to find users</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={messagingService.getConversationAvatar(selectedConversation, user?.id || 0)} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedConversation.is_group ? '👥' : getInitials(
                          messagingService.getConversationDisplayName(selectedConversation, user?.id || 0)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {messagingService.getConversationDisplayName(selectedConversation, user?.id || 0)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.is_group 
                          ? `${selectedConversation.participants.length} members`
                          : 'Active now'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        const sender = message.sender || selectedConversation.participants.find(p => p.id === message.sender_id);

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-3",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOwn && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={sender?.profile_image} />
                                <AvatarFallback className="text-xs">
                                  {sender ? getInitials(messagingService.getUserDisplayName(sender)) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn(
                              "max-w-[70%] space-y-1",
                              isOwn ? "items-end" : "items-start"
                            )}>
                              <div className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                isOwn 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {message.content}
                              </div>
                              
                              <div className={cn(
                                "flex items-center gap-1 text-xs text-muted-foreground",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                <span>{formatTime(message.created_at)}</span>
                                {isOwn && (
                                  message.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-blue-500" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>

                            {isOwn && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {user ? getInitials(`${user.first_name || ''} ${user.last_name || ''} ${user.email}`.trim()) : 'Me'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isSending}
                        className="pr-10"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
