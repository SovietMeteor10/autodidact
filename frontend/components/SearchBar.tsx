'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface SearchResult {
  path: string
  title: string
  heading?: string
  headingType?: 'heading' | 'subheading' | 'subsubheading'
  tagName?: string
  resultType: 'heading' | 'tag'
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search when query changes
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([])
        setShowResults(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error('Error searching:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      const result = results[selectedIndex]
      handleResultClick(result)
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setSelectedIndex(-1)
    }
  }

  const getHeadingIcon = (type?: string) => {
    switch (type) {
      case 'heading':
        return 'H1'
      case 'subheading':
        return 'H2'
      case 'subsubheading':
        return 'H3'
      default:
        return ''
    }
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.resultType === 'tag') {
      return 'TAG'
    }
    return getHeadingIcon(result.headingType)
  }

  const getResultDisplayText = (result: SearchResult) => {
    if (result.resultType === 'tag') {
      return result.tagName || ''
    }
    return result.heading || ''
  }

  const handleResultClick = (result: SearchResult, e?: React.MouseEvent) => {
    // Always prevent default to avoid any navigation issues
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setShowResults(false)
    setQuery('')
    
    // Check if we're already on this page
    const currentPath = pathname || '/'
    let resultPath = result.path || '/'
    
    // Normalize paths: ensure leading slash, remove trailing slash
    const normalizePath = (path: string): string => {
      if (path === '/') return '/'
      // Remove trailing slash
      let normalized = path.replace(/\/$/, '')
      // Ensure leading slash
      if (!normalized.startsWith('/')) {
        normalized = '/' + normalized
      }
      return normalized
    }
    
    const normalizedCurrent = normalizePath(currentPath)
    const normalizedResult = normalizePath(resultPath)
    
    // Compare normalized paths (case-sensitive for paths)
    if (normalizedCurrent === normalizedResult) {
      // Already on this page - just close the dropdown, don't navigate
      // This prevents the 404 error when clicking on current page
      return
    }
    
    // Navigate to the new page
    router.push(normalizedResult)
  }

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          // Only show results if there's a query and results exist
          if (query.trim() && results.length > 0) {
            setShowResults(true)
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search headings and tags..."
        style={{
          width: '100%',
          fontSize: '1rem',
          fontFamily: 'inherit',
          padding: '0.75rem 1rem',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          border: '1px solid #333',
          borderRadius: '4px',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#555'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333'
        }}
      />

      {/* Search Results Dropdown - only show if there's a query */}
      {query.trim() && showResults && (results.length > 0 || isLoading) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            width: '100%',
            marginTop: '0.5rem',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '1rem',
                color: '#999',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Searching...
            </div>
          ) : (
            <>
              {results.map((result, index) => {
                return (
                  <div
                    key={`${result.path}-${result.heading}-${index}`}
                    onClick={(e) => handleResultClick(result, e)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#ffffff',
                      backgroundColor: selectedIndex === index ? '#2a2a2a' : 'transparent',
                      borderBottom: '1px solid #333',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#999',
                        fontFamily: 'monospace',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: result.resultType === 'tag' ? '#1a3a1a' : '#0a0a0a',
                        borderRadius: '4px',
                        minWidth: '2.5rem',
                        textAlign: 'center',
                      }}
                    >
                      {getResultIcon(result)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
                          color: '#ffffff',
                          marginBottom: '0.25rem',
                          fontWeight: 500,
                        }}
                      >
                        {getResultDisplayText(result)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: '#999',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {result.path} • {result.title}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </>
          )}
        </div>
      )}

      {/* No results message - only show if there's a query */}
      {query.trim() && showResults && !isLoading && results.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            width: '100%',
            marginTop: '0.5rem',
            padding: '1rem',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#999',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          No headings or tags found matching "{query}"
        </div>
      )}
    </div>
  )
}

