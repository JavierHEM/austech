import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SessionKeepAlive } from '@/components/SessionKeepAlive'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestión',
  description: 'Sistema de gestión para empresas y sucursales',
  icons: {
    icon: '/icon-austech.ico',
    apple: '/icon-austech.ico',
    shortcut: '/icon-austech.ico'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <SessionKeepAlive interval={5} />
          {children}
        </Providers>
      </body>
    </html>
  )
}