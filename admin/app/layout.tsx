import type { Metadata } from 'next'
import { Roboto_Slab } from 'next/font/google'
import Providers from '@/components/Providers'
import './styles/globals.css'

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto-slab',
})

export const metadata: Metadata = {
  title: 'Autodidact Admin',
  description: 'Admin dashboard for Autodidact CMS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={robotoSlab.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

