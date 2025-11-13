'use client'

import { useState, useEffect } from 'react'
import TagInput from './TagInput'

interface Tag {
  id: string
  name: string
}

interface NodeTagsEditorProps {
  nodeId: string
  initialTags?: Tag[]
}

export default function NodeTagsEditor({
  nodeId,
  initialTags = [],
}: NodeTagsEditorProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update selected tags when initialTags change
  useEffect(() => {
    setSelectedTags(initialTags)
  }, [initialTags])

  // Save tags when they change
  useEffect(() => {
    const saveTags = async () => {
      // Don't save on initial mount - check if tags have actually changed
      const selectedIds = selectedTags.map(t => t.id).sort().join(',')
      const initialIds = initialTags.map(t => t.id).sort().join(',')
      if (selectedIds === initialIds) {
        return
      }

      setIsSaving(true)
      setError(null)

      try {
        const response = await fetch(`/api/nodes/${nodeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tagIds: selectedTags.map((tag) => tag.id),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update tags')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update tags')
        // Revert to previous tags on error
        setSelectedTags(initialTags)
      } finally {
        setIsSaving(false)
      }
    }

    // Debounce the save
    const timer = setTimeout(saveTags, 500)
    return () => clearTimeout(timer)
  }, [selectedTags, nodeId, initialTags])

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '1.5rem', 
        borderRadius: '4px',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <strong style={{ 
            display: 'block', 
            color: '#999', 
            fontSize: '0.9rem', 
            textTransform: 'uppercase' 
          }}>
            Tags
          </strong>
          {isSaving && (
            <span style={{ 
              color: '#999', 
              fontSize: '0.85rem',
              fontStyle: 'italic'
            }}>
              saving...
            </span>
          )}
        </div>
        <TagInput
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
        {error && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#3a1a1a',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            color: '#ff8888',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

