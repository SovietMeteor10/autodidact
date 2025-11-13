'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AdminBackButton from '@/components/AdminBackButton'
import SourceManager from '@/components/SourceManager'
import TagAutocomplete from '@/components/TagAutocomplete'
import TagInput from '@/components/TagInput'

interface ParentOption {
  id: string
  title: string
  path: string
}

type NodeType = 'top level' | 'mid level' | 'child'

export default function NewNodePage() {
  const router = useRouter()
  const [cursorPosition, setCursorPosition] = useState(0)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'top level' as NodeType,
    parentId: '',
    description: '',
    content: '',
  })
  const [selectedTags, setSelectedTags] = useState<Array<{ id: string; name: string }>>([])
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showParentDropdown, setShowParentDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch parent options on mount
  useEffect(() => {
    const fetchParentOptions = async () => {
      try {
        const response = await fetch('/api/nodes/parent-options')
        if (response.ok) {
          const data = await response.json()
          setParentOptions(data)
        }
      } catch (error) {
        console.error('Error fetching parent options:', error)
      }
    }
    fetchParentOptions()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-parent-dropdown]')) {
        setShowParentDropdown(false)
      }
    }

    if (showParentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showParentDropdown])

  // Filter parent options based on search query
  const filteredParentOptions = parentOptions.filter((option) =>
    option.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected parent title for display
  const selectedParent = parentOptions.find((opt) => opt.id === formData.parentId)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleTypeChange = (type: NodeType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      parentId: type === 'top level' ? '' : prev.parentId,
    }))
    setShowParentDropdown(false)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (formData.type !== 'top level' && !formData.parentId) {
      newErrors.parentId = 'Parent is required for mid level and child nodes'
    }

    if ((formData.type === 'top level' || formData.type === 'mid level') && !formData.description.trim()) {
      newErrors.description = 'Description is required for top level and mid level nodes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Format content based on node type
      let content: any
      if (formData.type === 'top level' || formData.type === 'mid level') {
        // Top/Mid level: JSON array with description
        if (formData.description.trim()) {
          content = [
            {
              type: 'description',
              text: formData.description.trim(),
            },
          ]
        } else {
          content = []
        }
      } else {
        // Child nodes: plain text string
        content = formData.content || ''
      }

      const requestBody: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content,
        tagIds: selectedTags.map((tag) => tag.id),
      }

      // Add parentId only if not top level
      if (formData.type !== 'top level') {
        requestBody.parentId = formData.parentId
      }

      const response = await fetch('/api/nodes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create node')
      }

      const createdNode = await response.json()
      
      // Redirect to the created node's edit page
      router.push(`/admin/nodes/${createdNode.id}`)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create node',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <AdminBackButton />
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textTransform: 'lowercase' }}>
        create new node
      </h1>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: '#1a1a1a',
            padding: '1.5rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
          }}
        >
          {/* Title Field */}
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              style={{
                width: '100%',
                fontSize: '1.2rem',
                fontFamily: 'inherit',
                padding: '0.5rem',
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                border: errors.title ? '1px solid #ff4444' : '1px solid #333',
                borderRadius: '4px',
              }}
              placeholder="Enter node title"
            />
            {errors.title && (
              <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Tags Field */}
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
              Tags
            </label>
            <TagInput
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {/* Slug Field */}
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
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
              style={{
                width: '100%',
                fontSize: '1rem',
                fontFamily: 'monospace',
                padding: '0.5rem',
                backgroundColor: '#0a0a0a',
                color: '#ffffff',
                border: errors.slug ? '1px solid #ff4444' : '1px solid #333',
                borderRadius: '4px',
              }}
              placeholder="node-slug"
            />
            {errors.slug && (
              <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.slug}
              </div>
            )}
            <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Lowercase letters, numbers, and hyphens only
            </div>
          </div>

          {/* Type Field */}
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
              Type *
            </label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {(['top level', 'mid level', 'child'] as NodeType[]).map((type) => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={() => handleTypeChange(type)}
                    style={{
                      marginRight: '0.5rem',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ textTransform: 'lowercase' }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Parent Field (conditional) */}
          {(formData.type === 'mid level' || formData.type === 'child') && (
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <label
                style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Parent *
              </label>
              <div style={{ position: 'relative' }} data-parent-dropdown>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowParentDropdown(true)
                  }}
                  onFocus={() => setShowParentDropdown(true)}
                  placeholder="Search for parent node..."
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    padding: '0.5rem',
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    border: errors.parentId ? '1px solid #ff4444' : '1px solid #333',
                    borderRadius: '4px',
                  }}
                />
                {selectedParent && !showParentDropdown && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      color: '#ccc',
                      fontSize: '0.9rem',
                    }}
                  >
                    Selected: {selectedParent.title} ({selectedParent.path})
                  </div>
                )}
                {showParentDropdown && filteredParentOptions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.25rem',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                    }}
                  >
                    {filteredParentOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => {
                          handleChange('parentId', option.id)
                          setSearchQuery(option.title)
                          setShowParentDropdown(false)
                        }}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #1a1a1a',
                          color: '#ffffff',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a1a1a'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{option.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                          {option.path}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showParentDropdown && filteredParentOptions.length === 0 && searchQuery && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.25rem',
                      padding: '0.75rem',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#999',
                    }}
                  >
                    No matching nodes found
                  </div>
                )}
              </div>
              {errors.parentId && (
                <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {errors.parentId}
                </div>
              )}
            </div>
          )}

          {/* Description Field (conditional) */}
          {(formData.type === 'top level' || formData.type === 'mid level') && (
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
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: errors.description ? '1px solid #ff4444' : '1px solid #333',
                  borderRadius: '4px',
                  minHeight: '120px',
                  resize: 'vertical',
                }}
                placeholder="Enter description for this node..."
              />
              {errors.description && (
                <div style={{ color: '#ff8888', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {errors.description}
                </div>
              )}
            </div>
          )}

          {/* Content Field (conditional - for child nodes) */}
          {formData.type === 'child' && (
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
                Content
              </label>
              <textarea
                ref={contentTextareaRef}
                value={formData.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition(target.selectionStart)
                }}
                onKeyUp={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition(target.selectionStart)
                }}
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  setCursorPosition(target.selectionStart)
                }}
                style={{
                  width: '100%',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  padding: '0.5rem',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  minHeight: '200px',
                  resize: 'vertical',
                }}
                placeholder="Enter content here. Use \cite{source-name} for citations and \embed{url} for videos."
              />
              <TagAutocomplete
                textarea={contentTextareaRef.current}
                content={formData.content || ''}
                cursorPosition={cursorPosition}
                onSelect={(path, startPos, endPos) => {
                  const currentContent = formData.content || ''
                  const textBefore = currentContent.substring(0, startPos)
                  const textAfter = currentContent.substring(endPos)
                  const newContent = textBefore + path + textAfter
                  handleChange('content', newContent)
                  // Set cursor position after the inserted path
                  setTimeout(() => {
                    if (contentTextareaRef.current) {
                      contentTextareaRef.current.focus()
                      const newPosition = startPos + path.length
                      contentTextareaRef.current.setSelectionRange(newPosition, newPosition)
                      setCursorPosition(newPosition)
                    }
                  }, 0)
                }}
              />
              <div style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\cite&#123;source-name&#125;</code> to cite sources</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\embed&#123;video-url&#125;</code> to embed videos</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\heading&#123;text&#125;</code>, <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\subheading&#123;text&#125;</code>, <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\subsubheading&#123;text&#125;</code> for headings</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\begin&#123;itemize&#125;</code> ... <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\end&#123;itemize&#125;</code> for bullet points</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\begin&#123;enumerate&#125;</code> ... <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\end&#123;enumerate&#125;</code> for numbered lists</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\begin&#123;list&#125;[arrow]</code> ... <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\end&#123;list&#125;</code> for custom markers (arrow, or any custom character)</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\item&#123;content&#125;</code> for each item within a list</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\link&#123;text, url&#125;</code> to create hyperlinks</div>
                <div>Use <code style={{ fontFamily: 'monospace', color: '#ccc' }}>\tag&#123;path&#125;</code> to link to another node (autocomplete appears when typing)</div>
              </div>
            </div>
          )}

          {/* Source Management for Child Nodes */}
          {formData.type === 'child' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#999',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                  }}
                >
                  Sources
                </label>
                <a
                  href="/admin/sources"
                  target="_blank"
                  rel="noopener noreferrer"
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
                  manage all sources →
                </a>
              </div>
              <SourceManager />
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#3a1a1a',
                border: '1px solid #ff4444',
                borderRadius: '4px',
                color: '#ff8888',
                fontSize: '0.9rem',
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                textTransform: 'lowercase',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              {isSubmitting ? 'creating...' : 'create node'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
