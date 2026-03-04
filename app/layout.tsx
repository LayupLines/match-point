import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: 'Match Point - Tennis Survivor Game',
  description: 'Tennis survivor game - pick players each round and compete to be the last one standing',
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
