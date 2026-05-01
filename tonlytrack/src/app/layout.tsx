import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'TonlyTrack — Fleet Maintenance System',
  description: 'Tonly Trucks Maintenance Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
