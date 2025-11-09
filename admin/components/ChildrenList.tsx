'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Child {
  id: string
  title: string
  slug: string
  path: string
}

interface ChildrenListProps {
  children: Child[]
  parentId: string
}

export default function ChildrenList({ children: initialChildren, parentId }: ChildrenListProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [orderedChildren, setOrderedChildren] = useState<Child[]>(initialChildren)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync orderedChildren when initialChildren changes (e.g., after save)
  useEffect(() => {
    setOrderedChildren(initialChildren)
    setHasChanges(false)
  }, [initialChildren])

  if (initialChildren.length === 0) {
    return null
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newOrder = [...orderedChildren]
    const [draggedItem] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(dropIndex, 0, draggedItem)
    
    setOrderedChildren(newOrder)
    setHasChanges(true)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const orderedIds = orderedChildren.map((child) => child.id)
      
      const response = await fetch('/api/nodes/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId,
          orderedIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reorder children')
      }

      const result = await response.json()
      
      // Update the ordered children with the response
      setOrderedChildren(result.children.map((child: any) => ({
        id: child.id,
        title: child.title,
        slug: child.slug,
        path: child.path,
      })))
      
      setHasChanges(false)
      
      // Refresh the page to show updated order
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '1.5rem', 
        borderRadius: '4px',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              textTransform: 'lowercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#555'
              e.currentTarget.style.backgroundColor = '#2a2a2a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span>
              {isExpanded ? 'hide' : 'view'} children ({orderedChildren.length})
            </span>
            <span
              style={{
                transition: 'transform 0.2s ease',
                fontSize: '0.8rem',
                display: 'inline-block',
              }}
            >
              {isExpanded ? '▼' : '◄'}
            </span>
          </button>

          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                textTransform: 'lowercase',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              {isSaving ? 'saving...' : 'save order'}
            </button>
          )}
        </div>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#3a1a1a',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            color: '#ff8888',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {isExpanded && (
          <div style={{ 
            marginTop: '1rem',
            fontFamily: 'monospace',
          }}>
            {orderedChildren.map((child, index) => {
              const isLast = index === orderedChildren.length - 1
              const connector = isLast ? '└── ' : '├── '
              const isDragging = draggedIndex === index
              const isDragOver = dragOverIndex === index
              
              return (
                <div
                  key={child.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    padding: '0.75rem',
                    paddingLeft: '1.5rem',
                    backgroundColor: isDragging ? '#2a2a2a' : isDragOver ? '#1a2a1a' : 'transparent',
                    border: isDragOver ? '1px dashed #555' : '1px solid transparent',
                    borderRadius: '4px',
                    cursor: 'grab',
                    opacity: isDragging ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.2rem',
                      color: '#ffffff',
                      marginRight: '0.5rem',
                      whiteSpace: 'pre',
                      fontFamily: 'monospace',
                      userSelect: 'none',
                    }}
                  >
                    {connector}
                  </span>
                  <Link
                    href={`/admin/nodes/${child.id}`}
                    style={{ 
                      color: '#ffffff', 
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      display: 'inline-block',
                      transition: 'opacity 0.2s ease',
                      flex: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                    onClick={(e) => {
                      // Prevent navigation when dragging
                      if (draggedIndex !== null) {
                        e.preventDefault()
                      }
                    }}
                  >
                    {child.title}
                  </Link>
                  <span
                    style={{
                      color: '#666',
                      fontSize: '0.9rem',
                      marginLeft: '0.5rem',
                      userSelect: 'none',
                    }}
                  >
                    ⋮⋮
                  </span>
                </div>
              )
            })}
            {orderedChildren.length > 0 && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #333',
                color: '#999',
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}>
                Drag and drop items to reorder. Click "save order" to persist changes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

