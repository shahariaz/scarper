'use client'

import React from 'react'
import { MessagingWidget } from '../../components/messaging/MessagingWidget'

export default function MessagesPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-6">
        <div className="h-[calc(100vh-120px)]">
          <MessagingWidget 
            className="h-full"
            isFullscreen={true}
          />
        </div>
      </div>
    </div>
  )
}
