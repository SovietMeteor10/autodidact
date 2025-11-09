'use client'

import { useState, useEffect, useRef } from 'react'

interface Node {
  id: string
  title: string
  path: string
}

interface TagAutocompleteProps {
  textarea: HTMLTextAreaElement | null
  content: string
  cursorPosition: number
  onSelect: (path: string, startPos: number, endPos: number) => void
}

export default function TagAutocomplete({
  textarea,
  content,
  cursorPosition,
  onSelect,
}: TagAutocompleteProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagStartPos, setTagStartPos] = useState(-1)
  const [tagEndPos, setTagEndPos] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await fetch('/api/nodes/list')
        if (response.ok) {
          const data = await response.json()
          setNodes(data)
        }
      } catch (error) {
        console.error('Error fetching nodes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNodes()
  }, [])

  // Check if cursor is inside \tag{...} (but not after closing brace)
  useEffect(() => {
    if (!textarea || cursorPosition < 0) {
      setIsVisible(false)
      return
    }

    // Look backwards from cursor to find \tag{
    const textBeforeCursor = content.substring(0, cursorPosition)
    const tagMatch = textBeforeCursor.match(/\\tag\{([^}]*)$/)
    
    if (tagMatch) {
      const matchStart = tagMatch.index! + tagMatch[0].indexOf('{') + 1
      const currentQuery = tagMatch[1] || '' // Get what's typed inside the braces
      
      // Check if there's a closing brace after the cursor - if so, hide dropdown
      const textAfterCursor = content.substring(cursorPosition)
      if (textAfterCursor.startsWith('}')) {
        setIsVisible(false)
        setSearchQuery('')
        return
      }
      
      // Look forward to find the closing brace
      const textAfterTag = content.substring(matchStart)
      const closingBraceIndex = textAfterTag.indexOf('}')
      const endPos = closingBraceIndex >= 0 ? matchStart + closingBraceIndex : cursorPosition
      
      setTagStartPos(matchStart)
      setTagEndPos(endPos)
      setSearchQuery(currentQuery.trim()) // Update search query with what's typed
      setIsVisible(true)
      setSelectedIndex(-1)
    } else {
      setIsVisible(false)
      setSearchQuery('')
    }
  }, [content, cursorPosition, textarea])

  // Filter nodes based on search query
  const filteredNodes = nodes.filter((node) =>
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible || !textarea) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredNodes.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && selectedIndex >= 0 && filteredNodes[selectedIndex]) {
        e.preventDefault()
        const node = filteredNodes[selectedIndex]
        let path = node.path.startsWith('/') ? node.path.slice(1) : node.path
        onSelect(path, tagStartPos, tagEndPos)
        setIsVisible(false)
      } else if (e.key === 'Escape') {
        setIsVisible(false)
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, selectedIndex, filteredNodes, tagStartPos, tagEndPos, onSelect, textarea])

  // Calculate dropdown position - pinned relative to textarea content, accounting for scroll
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!isVisible || !textarea) return

    const updatePosition = () => {
      if (!textarea) return
      
      const rect = textarea.getBoundingClientRect()
      const style = window.getComputedStyle(textarea)
      const paddingTop = parseInt(style.paddingTop) || 0
      const paddingLeft = parseInt(style.paddingLeft) || 0
      const lineHeight = parseInt(style.lineHeight) || 20
      const fontSize = parseInt(style.fontSize) || 16
      const fontFamily = style.fontFamily
      const fontWeight = style.fontWeight
      const borderWidth = parseInt(style.borderTopWidth) || 0

      // Get text up to the current cursor position (where user is typing inside \tag{})
      const textUpToCursor = content.substring(0, cursorPosition)
      
      // Split into lines to find which line the cursor is on
      const lines = textUpToCursor.split('\n')
      const lineNumber = lines.length - 1
      const textOnCurrentLine = lines[lines.length - 1]
      
      // Create a temporary element to measure text width up to cursor position
      const measureElement = document.createElement('span')
      measureElement.style.position = 'absolute'
      measureElement.style.visibility = 'hidden'
      measureElement.style.whiteSpace = 'pre'
      measureElement.style.fontSize = fontSize + 'px'
      measureElement.style.fontFamily = fontFamily
      measureElement.style.fontWeight = fontWeight
      measureElement.style.padding = '0'
      measureElement.style.margin = '0'
      measureElement.style.border = 'none'
      measureElement.textContent = textOnCurrentLine
      document.body.appendChild(measureElement)
      
      const textWidth = measureElement.offsetWidth
      document.body.removeChild(measureElement)
      
      // Calculate the absolute position of the line in the textarea (not accounting for scroll)
      const lineAbsoluteTop = paddingTop + (lineNumber * lineHeight)
      
      // Calculate position relative to viewport
      // Top: textarea top + absolute line position - scrollTop + one line height + small offset
      const top = rect.top + lineAbsoluteTop - textarea.scrollTop + lineHeight + 5
      // Left: textarea left + padding + text width (where cursor is) + small gap
      const left = rect.left + paddingLeft + borderWidth + textWidth + 5

      setDropdownPosition({ top, left })
    }

    // Initial position update
    updatePosition()

    // Update on scroll - critical for keeping it pinned
    const handleScroll = () => {
      updatePosition()
    }
    
    // Update on any content or cursor change
    const handleInput = () => {
      updatePosition()
    }

    textarea.addEventListener('scroll', handleScroll, { passive: true })
    textarea.addEventListener('input', handleInput)
    window.addEventListener('resize', updatePosition)

    // Use a more frequent update mechanism
    const intervalId = setInterval(updatePosition, 16) // ~60fps

    return () => {
      clearInterval(intervalId)
      textarea.removeEventListener('scroll', handleScroll)
      textarea.removeEventListener('input', handleInput)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, textarea, content, cursorPosition])

  if (!isVisible || isLoading) return null

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 10000,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        minWidth: '300px',
      }}
    >
      {filteredNodes.length > 0 ? (
        filteredNodes.map((node, index) => (
          <div
            key={node.id}
            onClick={() => {
              let path = node.path.startsWith('/') ? node.path.slice(1) : node.path
              onSelect(path, tagStartPos, tagEndPos)
              setIsVisible(false)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              padding: '0.75rem',
              cursor: 'pointer',
              backgroundColor: selectedIndex === index ? '#2a2a2a' : 'transparent',
              borderBottom: '1px solid #333',
            }}
          >
            <div
              style={{
                color: '#ffffff',
                fontSize: '0.95rem',
                marginBottom: '0.25rem',
              }}
            >
              {node.title}
            </div>
            <div
              style={{
                color: '#999',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            >
              {node.path}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            padding: '0.75rem',
            color: '#999',
            fontSize: '0.9rem',
          }}
        >
          No nodes found
        </div>
      )}
    </div>
  )
}

