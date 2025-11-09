'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminBackButton from '@/components/AdminBackButton'

interface Source {
  id: string
  name: string
  link: string
}

export default function SourcesPage() {
  const router = useRouter()
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', link: '' })
  const [error, setError] = useState<string | null>(null)

  // Fetch sources on mount
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

  const handleUpdate = async (id: string, name: string, link: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, link }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update source')
      }

      await fetchSources()
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete source')
      }

      await fetchSources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete source')
    }
  }

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <AdminBackButton />
        </div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <AdminBackButton />
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textTransform: 'lowercase' }}>
        sources
      </h1>

      {/* Create Form */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '4px',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'lowercase' }}>
          add new source
        </h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="source-name"
                required
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ flex: '2', minWidth: '300px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Link *
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
                required
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                disabled={isCreating}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.6 : 1,
                  textTransform: 'lowercase',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                {isCreating ? 'adding...' : 'add source'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#3a1a1a',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            color: '#ff8888',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Sources List */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'lowercase' }}>
          all sources ({sources.length})
        </h2>
        {sources.length === 0 ? (
          <div style={{ color: '#999', fontStyle: 'italic' }}>No sources yet. Add one above.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sources.map((source) => (
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
                {editingId === source.id ? (
                  <>
                    <input
                      type="text"
                      defaultValue={source.name}
                      id={`name-${source.id}`}
                      style={{
                        flex: '0 0 200px',
                        fontSize: '1rem',
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
                      defaultValue={source.link}
                      id={`link-${source.id}`}
                      style={{
                        flex: '1',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        padding: '0.5rem',
                        backgroundColor: '#1a1a1a',
                        color: '#ffffff',
                        border: '1px solid #333',
                        borderRadius: '4px',
                      }}
                    />
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById(`name-${source.id}`) as HTMLInputElement
                        const linkInput = document.getElementById(`link-${source.id}`) as HTMLInputElement
                        if (nameInput && linkInput) {
                          handleUpdate(source.id, nameInput.value, linkInput.value)
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textTransform: 'lowercase',
                        fontSize: '0.9rem',
                      }}
                    >
                      save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textTransform: 'lowercase',
                        fontSize: '0.9rem',
                      }}
                    >
                      cancel
                    </button>
                  </>
                ) : (
                  <>
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
                    <button
                      onClick={() => setEditingId(source.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textTransform: 'lowercase',
                        fontSize: '0.9rem',
                      }}
                    >
                      edit
                    </button>
                    <button
                      onClick={() => handleDelete(source.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#ff8888',
                        border: '1px solid #ff4444',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textTransform: 'lowercase',
                        fontSize: '0.9rem',
                      }}
                    >
                      delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

