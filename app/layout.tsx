import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Match Point - Wimbledon Survivor',
  description: 'Tennis survivor game for Wimbledon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
