import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages | BD Jobs Portal',
  description: 'Send and receive messages with other users',
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
