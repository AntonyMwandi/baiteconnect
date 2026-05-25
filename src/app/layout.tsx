// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/language-context'
import { AuthProvider }     from '@/lib/auth-context'
import Header               from '@/components/shared/Header'
import Footer               from '@/components/shared/Footer'

export const metadata: Metadata = {
  title:       'BaiteConnect — Meru County Public Participation Portal',
  description: 'Submit budget memoranda, track county projects, and make your voice count across all 45 wards of Meru County, Kenya.',
  keywords:    ['Meru County','public participation','budget','MTEF','Kenya','baiteconnect'],
  manifest:    '/manifest.json',
  icons: { icon: '/meru-logo.png', apple: '/meru-logo.png' },
  openGraph: {
    title:      'BaiteConnect — Meru County',
    description:'Digital Public Participation & Ward Budgeting Portal',
    url:        'https://baiteconnect.meru.go.ke',
    siteName:   'BaiteConnect',
    locale:     'en_KE',
    type:       'website',
  },
}

export const viewport: Viewport = {
  themeColor:   '#01411C',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body bg-neutralLight text-neutralDark antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <LanguageProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
