'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EditableNodeFieldsProps {
  nodeId: string
  initialTitle: string
  initialSlug: string
  initialPath: string
  initialDescription?: string | null
}

export default function EditableNodeFields({
  nodeId,
  initialTitle,
  initialSlug,
  initialPath,
  initialDescription = null,
}: EditableNodeFieldsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState<{
    title: boolean
    slug: boolean
    path: boolean
    description: boolean
  }>({
    title: false,
    slug: false,
    path: false,
    description: false,
  })

  const [values, setValues] = useState({
    title: initialTitle,
    slug: initialSlug,
    path: initialPath,
    description: initialDescription || '',
  })

  const [originalValues] = useState({
    title: initialTitle,
    slug: initialSlug,
    path: initialPath,
    description: initialDescription || '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if any values have changed
  const hasChanges =
    values.title !== originalValues.title ||
    values.slug !== originalValues.slug ||
    values.path !== originalValues.path ||
    values.description !== originalValues.description

  // Reset values if initial props change (e.g., after save)
  useEffect(() => {
    setValues({
      title: initialTitle,
      slug: initialSlug,
      path: initialPath,
      description: initialDescription || '',
    })
  }, [initialTitle, initialSlug, initialPath, initialDescription])

  const toggleEdit = (field: 'title' | 'slug' | 'path' | 'description') => {
    setIsEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleChange = (field: 'title' | 'slug' | 'path' | 'description', value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
  }

  const handleCancel = (field: 'title' | 'slug' | 'path' | 'description') => {
    // Reset the field value to its original value
    const originalValue = originalValues[field]
    setValues((prev) => ({
      ...prev,
      [field]: originalValue,
    }))
    setIsEditing((prev) => ({
      ...prev,
      [field]: false,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Get current node to preserve existing content structure
      const getResponse = await fetch(`/api/nodes/${nodeId}`)
      if (!getResponse.ok) {
        throw new Error('Failed to fetch current node')
      }
      const currentNode = await getResponse.json()

      // Update content to include description
      // If content is an array, we'll update the first text block or add one
      let updatedContent = currentNode.content || []
      if (Array.isArray(updatedContent)) {
        // Find or create a description block
        const descriptionBlock = updatedContent.find((block: any) => block.type === 'description' || (block.type === 'text' && block.isDescription))
        if (descriptionBlock) {
          descriptionBlock.text = values.description
        } else {
          // Add description as first block
          updatedContent = [{ type: 'text', text: values.description, isDescription: true }, ...updatedContent]
        }
      } else {
        // If content is not an array, create a new structure
        updatedContent = [{ type: 'text', text: values.description, isDescription: true }]
      }

      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          slug: values.slug,
          content: updatedContent,
          // Note: path is automatically calculated from slug and parentId by the API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update node')
      }

      const updated = await response.json()
      
      // Extract description from updated content
      let updatedDescription = ''
      if (Array.isArray(updated.content)) {
        const descBlock = updated.content.find((block: any) => block.type === 'description' || (block.type === 'text' && block.isDescription))
        if (descBlock) {
          updatedDescription = descBlock.text || ''
        }
      }

      // Update original values to reflect saved state
      originalValues.title = updated.title
      originalValues.slug = updated.slug
      originalValues.path = updated.path
      originalValues.description = updatedDescription

      // Update current values to match what was saved (path may have been recalculated)
      setValues({
        title: updated.title,
        slug: updated.slug,
        path: updated.path,
        description: updatedDescription,
      })

      // Exit edit mode
      setIsEditing({
        title: false,
        slug: false,
        path: false,
        description: false,
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update node')
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (
    label: string,
    field: 'title' | 'slug' | 'path' | 'description',
    value: string,
    isMonospace = false,
    isTextarea = false
  ) => {
    const editing = isEditing[field]
    const displayValue = value

    return (
      <div style={{ marginBottom: '1rem' }}>
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
            {label}
          </strong>
          <button
            onClick={() => {
              if (editing) {
                handleCancel(field)
              } else {
                toggleEdit(field)
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              textTransform: 'lowercase',
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
            title={editing ? 'Cancel editing' : 'Edit'}
          >
            {editing ? 'cancel' : 'edit'}
          </button>
        </div>
        {editing ? (
          <div>
            {isTextarea ? (
              <textarea
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  minHeight: '100px',
                  resize: 'vertical',
                }}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                style={{
                  width: '100%',
                  fontSize: isMonospace ? '1rem' : '1.2rem',
                  fontFamily: isMonospace ? 'monospace' : 'inherit',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                }}
                autoFocus
              />
            )}
          </div>
        ) : (
          <div style={{ 
            fontSize: isMonospace ? '1rem' : '1.2rem',
            fontFamily: isMonospace ? 'monospace' : 'inherit',
            color: isMonospace ? '#ccc' : value ? '#ffffff' : '#666',
            fontStyle: !value && field === 'description' ? 'italic' : 'normal'
          }}>
            {displayValue || (field === 'description' ? '(no description)' : '')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '1.5rem', 
        borderRadius: '4px',
        marginBottom: '1.5rem',
        position: 'relative'
      }}>
        {renderField('Title', 'title', values.title)}
        {renderField('Slug', 'slug', values.slug, true)}
        {renderField('Path', 'path', values.path, true)}
        {renderField('Description', 'description', values.description, false, true)}
        
        {isEditing.path && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#2a2a1a',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#ccc',
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            Note: Path is automatically calculated from slug and parent. Your manual edit will be recalculated on save.
          </div>
        )}
        
        {error && (
          <div style={{
            marginTop: '1rem',
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

        {hasChanges && (
          <div style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 1000,
          }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="button"
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
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              {isSaving ? 'saving...' : 'save'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

