'use client'

import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = searchParams.get('from') || '/admin'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
      } else {
        router.push(from)
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#0a0a0a'
    }}>
      <div style={{ 
        padding: '2rem', 
        border: '1px solid #333', 
        borderRadius: '8px',
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#1a1a1a'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          textTransform: 'lowercase',
          color: '#ffffff'
        }}>
          admin login
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem',
                textTransform: 'lowercase'
              }}
            >
              email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem',
                textTransform: 'lowercase'
              }}
            >
              password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#2a1a1a',
              border: '1px solid #663333',
              borderRadius: '4px',
              color: '#ff6666',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#333' : '#ffffff',
              color: loading ? '#666' : '#0a0a0a',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'lowercase',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'logging in...' : 'login'}
          </button>
        </form>
      </div>
    </div>
  )
}

