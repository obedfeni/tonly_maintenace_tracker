import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/lib/auth'
import { LangProvider } from '@/lib/lang-context'

export const metadata: Metadata = {
  title: 'TonlyTrack — Fleet Maintenance System',
  description: 'Tonly Trucks Maintenance Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <AuthProvider>{children}</AuthProvider>
        </LangProvider>
      </body>
    </html>
  )
}
