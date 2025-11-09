'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { extractCitations } from '@/lib/contentParser'

interface Source {
  id: string
  name: string
  link: string
}

interface NodeSourcesListProps {
  content: string
}

export default function NodeSourcesList({ content }: NodeSourcesListProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/sources')
        if (response.ok) {
          const data = await response.json()
          setSources(data)
        }
      } catch (error) {
        console.error('Error fetching sources:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSources()
  }, [])

  // Extract citations from content
  const citedSourceNames = extractCitations(content)
  
  // Find sources that are cited in this content
  const citedSources = sources.filter((source) =>
    citedSourceNames.includes(source.name)
  )

  if (isLoading) {
    return null
  }

  if (citedSources.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <strong style={{ display: 'block', color: '#999', fontSize: '0.9rem', textTransform: 'uppercase' }}>
            Sources Referenced
          </strong>
          <Link
            href="/admin/sources"
            style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '0.85rem',
              textTransform: 'lowercase',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999'
            }}
          >
            manage sources →
          </Link>
        </div>
        <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>
          No sources cited in this content. Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\cite&#123;source-name&#125;</code> to add citations.
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        padding: '1.5rem',
        borderRadius: '4px',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <strong style={{ display: 'block', color: '#999', fontSize: '0.9rem', textTransform: 'uppercase' }}>
          Sources Referenced ({citedSources.length})
        </strong>
        <Link
          href="/admin/sources"
          style={{
            color: '#999',
            textDecoration: 'none',
            fontSize: '0.85rem',
            textTransform: 'lowercase',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#999'
          }}
        >
          manage sources →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {citedSources.map((source) => (
          <div
            key={source.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem',
              backgroundColor: '#0a0a0a',
              borderRadius: '4px',
              border: '1px solid #333',
            }}
          >
            <div
              style={{
                flex: '0 0 200px',
                fontFamily: 'monospace',
                color: '#ffffff',
                fontSize: '1rem',
              }}
            >
              {source.name}
            </div>
            <a
              href={source.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: '1',
                color: '#999',
                textDecoration: 'none',
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#999'
              }}
            >
              {source.link}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

