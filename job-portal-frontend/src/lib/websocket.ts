import React from 'react';
import { store } from '../store/store';
import { 
  addNewNotification, 
  updateCommentLikeCount, 
  updateFollowCount 
} from '../store/slices/socialSlice';

type EventCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    this.connect();
  }

  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // Get auth token
      const state = store.getState();
      const token = state.auth.tokens.access_token;
      
      if (!token) {
        console.log('No auth token, skipping WebSocket connection');
        this.isConnecting = false;
        return;
      }

      // Connect to WebSocket with auth token
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws`
        : 'ws://localhost:5000/ws';
      
      this.socket = new WebSocket(`${wsUrl}?token=${token}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send authentication
        this.send('auth', { token });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.socket = null;
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
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
          commentId: (payload as any).comment_id, 
          increment: true 
        }));
        break;
        
      case 'comment_unliked':
        store.dispatch(updateCommentLikeCount({ 
          commentId: (payload as any).comment_id, 
          increment: false 
        }));
        break;
        
      case 'user_followed':
        store.dispatch(updateFollowCount({
          userId: (payload as any).user_id,
          followers: (payload as any).followers_count,
          following: (payload as any).following_count
        }));
        break;
        
      case 'user_unfollowed':
        store.dispatch(updateFollowCount({
          userId: (payload as any).user_id,
          followers: (payload as any).followers_count,
          following: (payload as any).following_count
        }));
        break;
        
      case 'new_comment':
        // Trigger comment list refresh
        this.emit(type, payload);
        break;
        
      case 'comment_reply':
        // Trigger comment replies refresh
        this.emit(type, payload);
        break;
        
      default:
        // Forward to custom event listeners
        this.emit(type as string, payload);
    }
  }

  send(type: string, payload: Record<string, unknown>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, cannot send message:', type);
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
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
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
