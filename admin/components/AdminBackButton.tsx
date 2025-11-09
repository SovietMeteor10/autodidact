'use client'

import { useRouter } from 'next/navigation'

export default function AdminBackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        cursor: 'pointer',
        fontSize: '0.9rem',
        padding: 0,
        textTransform: 'lowercase',
        display: 'inline-block',
        marginBottom: '1rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.7'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
    >
      ← back
    </button>
  )
}

