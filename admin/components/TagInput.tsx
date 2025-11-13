'use client'

import { useState, useEffect, useRef } from 'react'

interface Tag {
  id: string
  name: string
}

interface TagInputProps {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/tags?search=${encodeURIComponent(inputValue.trim())}`)
        if (response.ok) {
          const tags = await response.json()
          // Filter out already selected tags
          const filtered = tags.filter(
            (tag: Tag) => !selectedTags.some((selected) => selected.id === tag.id)
          )
          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0 || inputValue.trim().length > 0)
        }
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [inputValue, selectedTags])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (inputValue.trim() || suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleSelectTag = (tag: Tag) => {
    if (!selectedTags.some((t) => t.id === tag.id)) {
      onChange([...selectedTags, tag])
    }
    setInputValue('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleCreateTag = async () => {
    const tagName = inputValue.trim()
    if (!tagName) return

    // Check if tag already exists in suggestions
    const existing = suggestions.find(
      (tag) => tag.name.toLowerCase() === tagName.toLowerCase()
    )

    if (existing) {
      handleSelectTag(existing)
      return
    }

    // Create new tag
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: tagName }),
      })

      if (response.ok) {
        const newTag = await response.json()
        handleSelectTag(newTag)
      } else {
        const errorData = await response.json()
        console.error('Error creating tag:', errorData.error)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((tag) => tag.id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectTag(suggestions[selectedIndex])
      } else if (inputValue.trim()) {
        handleCreateTag()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  const isCreatingNew = inputValue.trim() && 
    !suggestions.some(
      (tag) => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
    )

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '4px',
          minHeight: '2.5rem',
          alignItems: 'center',
        }}
      >
        {/* Selected Tags */}
        {selectedTags.map((tag) => (
          <div
            key={tag.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1a1a1a',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ color: '#ffffff' }}>{tag.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: 0,
                width: '1.2rem',
                height: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#999'
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
          style={{
            flex: 1,
            minWidth: '120px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            padding: '0.25rem',
          }}
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
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
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '0.75rem',
                color: '#999',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Loading...
            </div>
          ) : (
            <>
              {suggestions.map((tag, index) => (
                <div
                  key={tag.id}
                  onClick={() => handleSelectTag(tag)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedIndex === index ? '#1a1a1a' : 'transparent',
                    borderBottom: '1px solid #1a1a1a',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                >
                  {tag.name}
                </div>
              ))}
              {isCreatingNew && (
                <div
                  onClick={handleCreateTag}
                  onMouseEnter={() => setSelectedIndex(suggestions.length)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedIndex === suggestions.length
                        ? '#1a1a1a'
                        : 'transparent',
                    borderTop: '1px solid #333',
                    color: '#999',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                  }}
                >
                  Create "{inputValue.trim()}"
                </div>
              )}
              {suggestions.length === 0 && !isCreatingNew && inputValue.trim() && (
                <div
                  style={{
                    padding: '0.75rem',
                    color: '#999',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                  }}
                >
                  No tags found. Press Enter to create "{inputValue.trim()}"
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

