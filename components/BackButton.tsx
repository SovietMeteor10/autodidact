'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="folder-link back-button"
      style={{
        color: '#ffffff',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        font: 'inherit'
      }}
    >
      ← Back
    </button>
  )
}

