'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function AdminNavIcons() {
  async function handleLogout() {
    try {
      // Sign out and redirect to login page
      await signOut({ 
        redirect: true,
        callbackUrl: '/login'
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force redirect to login if signOut fails
      window.location.href = '/login'
    }
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Home icon button */}
      <div style={{ position: 'relative' }}>
        <Link
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '0'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </Link>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '0.75rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            zIndex: 1001,
          }}
          className="tooltip"
        >
          dashboard
        </span>
      </div>

      {/* Plus icon button */}
      <div style={{ position: 'relative' }}>
        <Link
          href="/admin/nodes/new"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '0'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '0.75rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            zIndex: 1001,
          }}
          className="tooltip"
        >
          new node
        </span>
      </div>

      {/* Tags icon button */}
      <div style={{ position: 'relative' }}>
        <Link
          href="/admin/tags"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#ffffff',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '0'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </Link>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '0.75rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            zIndex: 1001,
          }}
          className="tooltip"
        >
          tags
        </span>
      </div>

      {/* Logout icon button */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
            const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
            if (tooltip) tooltip.style.opacity = '0'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        <span
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            fontSize: '0.75rem',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            zIndex: 1001,
          }}
          className="tooltip"
        >
          logout
        </span>
      </div>
    </div>
  )
}

