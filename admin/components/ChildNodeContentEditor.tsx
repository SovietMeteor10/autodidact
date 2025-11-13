'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import TagAutocomplete from './TagAutocomplete'

interface ChildNodeContentEditorProps {
  nodeId: string
  initialContent: string
}

export default function ChildNodeContentEditor({
  nodeId,
  initialContent,
}: ChildNodeContentEditorProps) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(initialContent || '')
  }, [initialContent])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update content')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(initialContent || '')
    setIsEditing(false)
    setError(null)
  }

  if (!isEditing) {
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
            Content
          </strong>
          <button
            onClick={() => setIsEditing(true)}
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
          >
            edit
          </button>
        </div>
        <div
          style={{
            fontSize: '1rem',
            lineHeight: '1.8',
            color: content ? '#ffffff' : '#666',
            fontStyle: !content ? 'italic' : 'normal',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content || '(no content)'}
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
          Content
        </strong>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              textTransform: 'lowercase',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {isSaving ? 'saving...' : 'save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid #333',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              textTransform: 'lowercase',
              fontSize: '0.9rem',
            }}
          >
            cancel
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
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
          minHeight: '300px',
          resize: 'vertical',
        }}
        placeholder="Enter content here. Use \cite{source-name} for citations and \embed{url} for videos."
      />
      <TagAutocomplete
        textarea={textareaRef.current}
        content={content}
        cursorPosition={cursorPosition}
        onSelect={(path, startPos, endPos) => {
          const textBefore = content.substring(0, startPos)
          const textAfter = content.substring(endPos)
          const newContent = textBefore + path + textAfter
          setContent(newContent)
          // Set cursor position after the inserted path
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus()
              const newPosition = startPos + path.length
              textareaRef.current.setSelectionRange(newPosition, newPosition)
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
      {error && (
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
          {error}
        </div>
      )}
    </div>
  )
}

