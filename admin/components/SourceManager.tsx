'use client'

import { useState, useEffect } from 'react'

interface Source {
  id: string
  name: string
  link: string
}

export default function SourceManager() {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({ name: '', link: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSources()
  }, [])

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create source')
      }

      await fetchSources()
      setFormData({ name: '', link: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return <div style={{ color: '#666', fontSize: '0.9rem' }}>Loading sources...</div>
  }

  return (
    <div
      style={{
        backgroundColor: '#0a0a0a',
        padding: '1rem',
        borderRadius: '4px',
        border: '1px solid #333',
      }}
    >
      {/* Create Source Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="source-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              flex: '1',
              minWidth: '150px',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              padding: '0.5rem',
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #333',
              borderRadius: '4px',
            }}
          />
          <input
            type="url"
            placeholder="https://example.com"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            style={{
              flex: '2',
              minWidth: '200px',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              padding: '0.5rem',
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #333',
              borderRadius: '4px',
            }}
          />
          <button
            type="submit"
            disabled={isCreating || !formData.name || !formData.link}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              cursor: isCreating || !formData.name || !formData.link ? 'not-allowed' : 'pointer',
              opacity: isCreating || !formData.name || !formData.link ? 0.6 : 1,
              textTransform: 'lowercase',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {isCreating ? 'adding...' : 'add'}
          </button>
        </div>
        {error && (
          <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
      </form>

      {/* Sources List */}
      {sources.length > 0 ? (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Available Sources ({sources.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sources.map((source) => (
              <div
                key={source.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              >
                <code
                  style={{
                    fontFamily: 'monospace',
                    color: '#ccc',
                    flex: '0 0 150px',
                  }}
                >
                  {source.name}
                </code>
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#999',
                    textDecoration: 'none',
                    flex: '1',
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
      ) : (
        <div style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic' }}>
          No sources yet. Add one above.
        </div>
      )}
    </div>
  )
}

