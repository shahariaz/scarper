'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { webSocketService } from '@/lib/websocket';

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, tokens } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && tokens?.access_token) {
      // Initialize WebSocket connection when user is authenticated
      if (!webSocketService.isConnected) {
        webSocketService.reconnect();
      }
    } else {
      // Disconnect WebSocket when user is not authenticated
      webSocketService.disconnect();
    }

    return () => {
      // Cleanup on unmount
      webSocketService.disconnect();
    };
  }, [isAuthenticated, tokens?.access_token]);

  return <>{children}</>;
}
