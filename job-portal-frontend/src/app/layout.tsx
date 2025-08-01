import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ConditionalHeader from "@/components/ConditionalHeader";
import AccountStatusChecker from "@/components/AccountStatusChecker";
import WebSocketProvider from "@/components/WebSocketProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BD Jobs Portal - Find Your Dream Job",
  description: "Discover the latest job opportunities from top Bangladeshi software companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} antialiased min-h-screen bg-background`}
        suppressHydrationWarning
      >
        <Providers>
          <WebSocketProvider>
            <AccountStatusChecker>
              <ConditionalHeader />
              {children}
              <Toaster position="top-right" />
            </AccountStatusChecker>
          </WebSocketProvider>
        </Providers>
      </body>
    </html>
  );
}
