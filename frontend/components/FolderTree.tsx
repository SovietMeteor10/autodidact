'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

interface FolderTreeProps {
  nodes: TreeNode[]
}

export default function FolderTree({ nodes }: FolderTreeProps) {
  // Track which nodes are expanded by their path (unique identifier)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const renderNode = (
    node: TreeNode,
    depth: number = 0,
    isLast: boolean = false,
    parentPrefix: string = ''
  ): JSX.Element => {
    // Check if node has children (folders have children, leaves don't)
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const isExpanded = expanded.has(node.path)
    
    // Build tree connector prefix
    let connector = ''
    if (depth === 0) {
      // First level - simple connector
      connector = isLast ? '└── ' : '├── '
    } else {
      // Deeper levels - include parent vertical lines
      connector = parentPrefix + (isLast ? '└── ' : '├── ')
    }
    
    // Calculate prefix for children (vertical lines)
    const childPrefix = parentPrefix + (isLast ? '    ' : '│   ')

    return (
      <div key={node.path}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.25rem',
            fontFamily: 'monospace',
            paddingLeft: depth > 0 ? '1.5rem' : '1.5rem',
          }}
        >
          {/* Tree connector */}
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
          
          {/* Node name as link */}
          <Link
            href={node.path}
            className="folder-link"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '1.2rem',
              fontFamily: 'var(--font-roboto-slab), serif',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {node.name.toLowerCase()}
          </Link>
          
          {/* Dropdown arrow - only show for folders (nodes with children), not leaves */}
          {hasChildren && (
            <button
              onClick={(e) => toggleExpand(node.path, e)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '0.5rem',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.2rem',
                height: '1.2rem',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s ease',
              }}
              className="tree-arrow"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              ▼
            </button>
          )}
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, index) => {
              const childIsLast = index === node.children!.length - 1
              return renderNode(child, depth + 1, childIsLast, childPrefix)
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        fontFamily: 'monospace',
        lineHeight: '1.8',
        fontSize: '1.2rem',
      }}
    >
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1
        return renderNode(node, 0, isLast)
      })}
    </div>
  )
}

