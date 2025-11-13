'use client'

import { useState, useEffect } from 'react'
import AdminBackButton from '@/components/AdminBackButton'

interface Tag {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface TagWithUsage extends Tag {
  nodeCount: number
}

interface Node {
  id: string
  title: string
  path: string
  slug: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagWithUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [tagNodes, setTagNodes] = useState<Node[]>([])
  const [isLoadingNodes, setIsLoadingNodes] = useState(false)
  const [nodeSearchQuery, setNodeSearchQuery] = useState('')
  const [availableNodes, setAvailableNodes] = useState<Node[]>([])
  const [isLoadingAvailableNodes, setIsLoadingAvailableNodes] = useState(false)

  // Fetch tags on mount
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data: Tag[] = await response.json()
        
        // Fetch usage count for each tag
        const tagsWithUsage = await Promise.all(
          data.map(async (tag) => {
            try {
              const usageResponse = await fetch(`/api/tags/${tag.id}/usage`)
              const usageData = usageResponse.ok ? await usageResponse.json() : { nodeCount: 0 }
              return {
                ...tag,
                nodeCount: usageData.nodeCount || 0,
              }
            } catch (err) {
              // If usage endpoint fails, default to 0
              return {
                ...tag,
                nodeCount: 0,
              }
            }
          })
        )
        
        setTags(tagsWithUsage)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tag')
      }

      await fetchTags()
      setFormData({ name: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (id: string, name: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update tag')
      }

      await fetchTags()
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag')
    }
  }

  const handleDelete = async (id: string, name: string, nodeCount: number) => {
    if (nodeCount > 0) {
      alert(`Cannot delete tag "${name}". It is currently used by ${nodeCount} node(s). Please remove the tag from all nodes first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete the tag "${name}"?`)) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete tag')
      }

      await fetchTags()
      if (selectedTagId === id) {
        setSelectedTagId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag')
    }
  }

  const handleTagClick = async (tagId: string) => {
    if (selectedTagId === tagId) {
      // Close if already selected
      setSelectedTagId(null)
      setTagNodes([])
      return
    }

    setSelectedTagId(tagId)
    setIsLoadingNodes(true)
    setError(null)

    try {
      const response = await fetch(`/api/tags/${tagId}/nodes`)
      if (response.ok) {
        const data = await response.json()
        setTagNodes(data.nodes || [])
      } else {
        throw new Error('Failed to fetch tag nodes')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tag nodes')
      setTagNodes([])
    } finally {
      setIsLoadingNodes(false)
    }
  }

  const handleRemoveNode = async (tagId: string, nodeId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/tags/${tagId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeIds: [nodeId],
          action: 'remove',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove node from tag')
      }

      const data = await response.json()
      setTagNodes(data.nodes || [])
      await fetchTags() // Refresh tag counts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove node from tag')
    }
  }

  const handleAddNode = async (tagId: string, nodeId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/tags/${tagId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeIds: [nodeId],
          action: 'add',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add node to tag')
      }

      const data = await response.json()
      setTagNodes(data.nodes || [])
      setNodeSearchQuery('')
      setAvailableNodes([])
      await fetchTags() // Refresh tag counts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add node to tag')
    }
  }

  // Search for available nodes to add
  useEffect(() => {
    if (!selectedTagId || !nodeSearchQuery.trim()) {
      setAvailableNodes([])
      return
    }

    const searchNodes = async () => {
      setIsLoadingAvailableNodes(true)
      try {
        const response = await fetch('/api/nodes/list')
        if (response.ok) {
          const allNodes: Node[] = await response.json()
          // Filter out nodes that already have this tag
          const currentNodeIds = new Set(tagNodes.map(n => n.id))
          const filtered = allNodes.filter(
            node => 
              !currentNodeIds.has(node.id) &&
              node.title.toLowerCase().includes(nodeSearchQuery.toLowerCase())
          )
          setAvailableNodes(filtered.slice(0, 10)) // Limit to 10 results
        }
      } catch (err) {
        console.error('Error searching nodes:', err)
      } finally {
        setIsLoadingAvailableNodes(false)
      }
    }

    const timer = setTimeout(searchNodes, 300)
    return () => clearTimeout(timer)
  }, [nodeSearchQuery, selectedTagId, tagNodes])

  // Filter tags based on search query
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        tags
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
          add new tag
        </h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
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
                placeholder="tag-name"
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
                {isCreating ? 'creating...' : 'create tag'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginBottom: '2rem',
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

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          style={{
            width: '100%',
            maxWidth: '400px',
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

      {/* Tags List */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '4px',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'lowercase' }}>
          all tags ({filteredTags.length})
        </h2>
        {filteredTags.length === 0 ? (
          <div style={{ color: '#999', fontSize: '0.9rem' }}>
            {searchQuery ? 'No tags found matching your search.' : 'No tags yet. Create one above.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredTags.map((tag) => (
              <div key={tag.id}>
                <div
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
                {editingId === tag.id ? (
                  <>
                    <input
                      type="text"
                      defaultValue={tag.name}
                      id={`name-${tag.id}`}
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
                    <div style={{ color: '#999', fontSize: '0.85rem', minWidth: '120px' }}>
                      Used by {tag.nodeCount} node{tag.nodeCount !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById(`name-${tag.id}`) as HTMLInputElement
                        if (nameInput) {
                          handleUpdate(tag.id, nameInput.value)
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
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handleTagClick(tag.id)}
                    >
                      <div style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                        {tag.name}
                      </div>
                      <div style={{ color: '#999', fontSize: '0.85rem' }}>
                        Used by {tag.nodeCount} node{tag.nodeCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingId(tag.id)}
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
                      onClick={() => handleDelete(tag.id, tag.name, tag.nodeCount)}
                      disabled={tag.nodeCount > 0}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: tag.nodeCount > 0 ? '#333' : '#ff4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: tag.nodeCount > 0 ? 'not-allowed' : 'pointer',
                        opacity: tag.nodeCount > 0 ? 0.5 : 1,
                        textTransform: 'lowercase',
                        fontSize: '0.9rem',
                      }}
                      title={tag.nodeCount > 0 ? 'Cannot delete: tag is in use' : 'Delete tag'}
                    >
                      delete
                    </button>
                  </>
                )}
                </div>
              
                {/* Tag Detail View - Show nodes and allow add/remove */}
                {selectedTagId === tag.id && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    border: '1px solid #333',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textTransform: 'lowercase' }}>
                    nodes with this tag
                  </h3>
                  
                  {isLoadingNodes ? (
                    <div style={{ color: '#999', fontSize: '0.9rem' }}>Loading nodes...</div>
                  ) : (
                    <>
                      {/* Add Node Section */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label
                          style={{
                            display: 'block',
                            color: '#999',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Add Node
                        </label>
                        <input
                          type="text"
                          value={nodeSearchQuery}
                          onChange={(e) => setNodeSearchQuery(e.target.value)}
                          placeholder="Search for a node to add..."
                          style={{
                            width: '100%',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            padding: '0.5rem',
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            marginBottom: '0.5rem',
                          }}
                        />
                        {nodeSearchQuery.trim() && (
                          <div
                            style={{
                              backgroundColor: '#1a1a1a',
                              border: '1px solid #333',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                            }}
                          >
                            {isLoadingAvailableNodes ? (
                              <div style={{ padding: '0.5rem', color: '#999', fontSize: '0.9rem' }}>
                                Searching...
                              </div>
                            ) : availableNodes.length === 0 ? (
                              <div style={{ padding: '0.5rem', color: '#999', fontSize: '0.9rem' }}>
                                No nodes found
                              </div>
                            ) : (
                              availableNodes.map((node) => (
                                <div
                                  key={node.id}
                                  onClick={() => handleAddNode(tag.id, node.id)}
                                  style={{
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #333',
                                    color: '#ffffff',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2a2a2a'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <div style={{ fontSize: '0.9rem' }}>{node.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                    {node.path}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Current Nodes List */}
                      {tagNodes.length === 0 ? (
                        <div style={{ color: '#999', fontSize: '0.9rem' }}>
                          No nodes have this tag yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {tagNodes.map((node) => (
                            <div
                              key={node.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '4px',
                                border: '1px solid #333',
                              }}
                            >
                              <div>
                                <div style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                                  {node.title}
                                </div>
                                <div style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                  {node.path}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveNode(tag.id, node.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#ff4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  textTransform: 'lowercase',
                                  fontSize: '0.9rem',
                                }}
                              >
                                remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

