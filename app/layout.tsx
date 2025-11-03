import type { Metadata } from 'next'
import { Roboto_Slab } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto-slab',
})

export const metadata: Metadata = {
  title: 'Curriculum and Notes',
  description: 'A space to compile resources and notes from studies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={robotoSlab.variable}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}

