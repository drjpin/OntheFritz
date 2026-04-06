import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChiroSite AI',
  description: 'AI-powered websites for chiropractors',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
