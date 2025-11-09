'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CollapsibleSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true')
    }
  }, [])

  // Save sidebar state to localStorage when it changes
  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('admin-sidebar-collapsed', String(newState))
  }

  return (
    <>
      {/* Sidebar */}
      <aside 
        style={{ 
          width: isCollapsed ? '0' : '130px',
          minWidth: isCollapsed ? '0' : '130px',
          maxWidth: isCollapsed ? '0' : '130px',
          height: '100vh',
          borderRight: isCollapsed ? 'none' : '1px solid #333',
          backgroundColor: '#0a0a0a',
          overflow: 'hidden',
          transition: 'width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease, border 0.3s ease',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Toggle button - left aligned */}
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '0.5rem',
            zIndex: 10,
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s ease',
            opacity: isCollapsed ? 0 : 1,
            pointerEvents: isCollapsed ? 'none' : 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem' }}>→</span>
        </button>

        {/* Navigation */}
        <nav style={{ 
          marginTop: '4rem',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            margin: 0,
          }}>
            <li style={{ marginBottom: '1rem', position: 'relative' }}>
              <Link 
                href="/admin" 
                style={{ 
                  color: '#ffffff', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7'
                  e.currentTarget.style.backgroundColor = '#1a1a1a'
                  const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
                  if (tooltip) tooltip.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.backgroundColor = 'transparent'
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
                  style={{ display: 'block' }}
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
                  zIndex: 1000,
                }}
                className="tooltip"
              >
                dashboard
              </span>
            </li>
            <li style={{ marginBottom: '1rem', position: 'relative' }}>
              <Link 
                href="/admin/nodes/new" 
                style={{ 
                  color: '#ffffff', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7'
                  e.currentTarget.style.backgroundColor = '#1a1a1a'
                  const tooltip = e.currentTarget.parentElement?.querySelector('.tooltip') as HTMLElement
                  if (tooltip) tooltip.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.backgroundColor = 'transparent'
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
                  style={{ display: 'block' }}
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
                  zIndex: 1000,
                }}
                className="tooltip"
              >
                new node
              </span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Toggle button when collapsed - fixed on left edge */}
      {isCollapsed && (
        <button
          onClick={handleToggle}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '0.5rem',
            zIndex: 1001,
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.backgroundColor = '#2a2a2a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.backgroundColor = '#1a1a1a'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
            <div style={{ width: '10px', height: '2px', backgroundColor: '#ffffff' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem' }}>→</span>
        </button>
      )}
    </>
  )
}
