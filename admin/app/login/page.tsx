import { Suspense } from 'react'
import LoginContent from './LoginContent'

// Force dynamic rendering (login page should never be prerendered)
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#0a0a0a',
        color: '#ffffff'
      }}>
        <div>loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
