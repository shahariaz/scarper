import React from 'react';
import { io, Socket } from 'socket.io-client';
import { store } from '../store/store';
import { 
  addNewNotification, 
  updateCommentLikeCount, 
  updateFollowCount 
} from '../store/slices/socialSlice';
import { updateBlogLikes } from '../store/slices/blogsSlice';

type EventCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    // Don't auto-connect on construction
    // Connection will be initiated when auth token is available
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // Get auth token
      const state = store.getState();
      const token = state.auth.tokens?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping Socket.IO connection');
        this.isConnecting = false;
        return;
      }

      console.log('Connecting to Socket.IO with token...');

      // Connect to Socket.IO with auth token
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? `https://${window.location.host}`
        : 'http://localhost:5000';
      
      console.log('Connecting to Socket.IO at:', socketUrl);
      
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected with session ID:', this.socket?.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnecting = false;
        
        // Attempt to reconnect if not a clean disconnect
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnecting = false;
        this.scheduleReconnect();
      });

      // Register specific event handlers
      this.socket.on('blog_liked', (data) => {
        console.log('Received blog_liked event:', data);
        this.handleMessage({ type: 'blog_liked', payload: data });
      });

      this.socket.on('blog_unliked', (data) => {
        console.log('Received blog_unliked event:', data);
        this.handleMessage({ type: 'blog_unliked', payload: data });
      });

      this.socket.on('comment_liked', (data) => {
        this.handleMessage({ type: 'comment_liked', payload: data });
      });

      this.socket.on('comment_unliked', (data) => {
        this.handleMessage({ type: 'comment_unliked', payload: data });
      });

      this.socket.on('new_comment', (data) => {
        this.handleMessage({ type: 'new_comment', payload: data });
      });

      this.socket.on('comment_reply', (data) => {
        this.handleMessage({ type: 'comment_reply', payload: data });
      });

      this.socket.on('notification', (data) => {
        this.handleMessage({ type: 'notification', payload: data });
      });

      this.socket.on('user_followed', (data) => {
        this.handleMessage({ type: 'user_followed', payload: data });
      });

      this.socket.on('user_unfollowed', (data) => {
        this.handleMessage({ type: 'user_unfollowed', payload: data });
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  private handleMessage(data: Record<string, unknown>) {
    const { type, payload } = data;
    console.log('WebSocket message received:', type, payload);

    // Dispatch to Redux store based on message type
    switch (type) {
      case 'notification':
        store.dispatch(addNewNotification(payload as any));
        break;
        
      case 'comment_liked':
        store.dispatch(updateCommentLikeCount({ 
          commentId: (payload as Record<string, unknown>).comment_id as number, 
          increment: true 
        }));
        break;
        
      case 'comment_unliked':
        store.dispatch(updateCommentLikeCount({ 
          commentId: (payload as Record<string, unknown>).comment_id as number, 
          increment: false 
        }));
        break;
        
      case 'user_followed':
        store.dispatch(updateFollowCount({
          userId: (payload as Record<string, unknown>).user_id as number,
          followers: (payload as Record<string, unknown>).followers_count as number,
          following: (payload as Record<string, unknown>).following_count as number
        }));
        break;
        
      case 'user_unfollowed':
        store.dispatch(updateFollowCount({
          userId: (payload as Record<string, unknown>).user_id as number,
          followers: (payload as Record<string, unknown>).followers_count as number,
          following: (payload as Record<string, unknown>).following_count as number
        }));
        break;
        
      case 'blog_liked':
        // Update blog like count in Redux store
        if ((payload as Record<string, unknown>).blog_id && typeof (payload as Record<string, unknown>).likes_count === 'number') {
          store.dispatch(updateBlogLikes({
            blogId: (payload as Record<string, unknown>).blog_id as number,
            likesCount: (payload as Record<string, unknown>).likes_count as number
          }));
        }
        // Also forward to custom event listeners
        this.emit(type, payload as Record<string, unknown>);
        break;
        
      case 'blog_unliked':
        // Update blog like count in Redux store
        if ((payload as Record<string, unknown>).blog_id && typeof (payload as Record<string, unknown>).likes_count === 'number') {
          store.dispatch(updateBlogLikes({
            blogId: (payload as Record<string, unknown>).blog_id as number,
            likesCount: (payload as Record<string, unknown>).likes_count as number
          }));
        }
        // Also forward to custom event listeners
        this.emit(type, payload as Record<string, unknown>);
        break;
        
      case 'new_comment':
        // Trigger comment list refresh
        this.emit(type, payload as Record<string, unknown>);
        break;
        
      case 'comment_reply':
        // Trigger comment replies refresh
        this.emit(type, payload as Record<string, unknown>);
        break;
        
      default:
        // Forward to custom event listeners
        this.emit(type as string, payload as Record<string, unknown>);
    }
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, payload);
    } else {
      console.warn('Socket.IO not connected, cannot send message:', type);
    }
  }

  // Subscribe to custom events
  on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  // Unsubscribe from custom events
  off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  // Emit custom events
  private emit(event: string, data: Record<string, unknown>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Join a room (for blog comments, user activities, etc.)
  joinRoom(room: string) {
    this.send('join_room', { room });
  }

  // Leave a room
  leaveRoom(room: string) {
    this.send('leave_room', { room });
  }

  // Subscribe to blog updates
  subscribeToBlog(blogId: number) {
    this.joinRoom(`blog_${blogId}`);
  }

  // Unsubscribe from blog updates
  unsubscribeFromBlog(blogId: number) {
    this.leaveRoom(`blog_${blogId}`);
  }

  // Subscribe to user updates
  subscribeToUser(userId: number) {
    this.joinRoom(`user_${userId}`);
  }

  // Unsubscribe from user updates
  unsubscribeFromUser(userId: number) {
    this.leaveRoom(`user_${userId}`);
  }

  // Get connection status
  get isConnected() {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  // Manually trigger reconnection
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    setTimeout(() => this.connect(), 100);
  }

  // Connect when authenticated
  connectIfAuthenticated() {
    const state = store.getState();
    const token = state.auth.tokens?.access_token;
    
    if (token && !this.isConnected) {
      console.log('Auth token available, connecting to Socket.IO...');
      this.connect();
    } else if (!token) {
      console.log('No auth token available for Socket.IO connection');
    }
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// React hook for WebSocket events
export const useWebSocket = (event: string, callback: EventCallback) => {
  React.useEffect(() => {
    webSocketService.on(event, callback);
    return () => webSocketService.off(event, callback);
  }, [event, callback]);
};

// React hook for connection status
export const useWebSocketConnection = () => {
  const [isConnected, setIsConnected] = React.useState(webSocketService.isConnected);

  React.useEffect(() => {
    const checkConnection = () => {
      setIsConnected(webSocketService.isConnected);
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return isConnected;
};

export default webSocketService;
