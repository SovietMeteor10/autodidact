'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

interface FileTreeProps {
  root: TreeNode
}

export default function FileTree({ root }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([root.name]))

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expanded)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpanded(newExpanded)
  }

  const renderNode = (node: TreeNode, depth: number = 0, isLast: boolean = false, parentVerticalLines: string = ''): JSX.Element => {
    const isExpanded = expanded.has(node.name)
    const hasChildren = node.children && node.children.length > 0
    const isRoot = depth === 0
    
    // Build the prefix string for tree connectors
    // For first-level children, just use the connector without any vertical lines
    // For deeper levels, combine parent vertical lines with the connector
    let currentLinePrefix = ''
    if (!isRoot) {
      if (depth === 1) {
        // First level children (About, Economics, etc.) - no vertical lines before connector
        currentLinePrefix = isLast ? '└── ' : '├── '
      } else {
        // Deeper levels - include parent vertical lines
        currentLinePrefix = parentVerticalLines + (isLast ? '└── ' : '├── ')
      }
    }
    
    // Calculate vertical lines to pass to children
    // For root's children, no vertical lines
    // For deeper levels, add vertical line if this node has siblings
    const childVerticalLines = isRoot ? '' : parentVerticalLines + (isLast ? '    ' : '│   ')
    
    return (
      <div key={node.name}>
        <div 
          className="tree-node"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '0.25rem', 
            fontFamily: 'monospace',
            paddingLeft: depth > 0 ? '1.5rem' : '0',
          }}
        >
          <span style={{ fontSize: '1.2rem', color: '#ffffff', marginRight: '0.5rem', whiteSpace: 'pre', fontFamily: 'monospace', userSelect: 'none' }}>
            {currentLinePrefix}
          </span>
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
          {hasChildren && (
            <button
              onClick={(e) => toggleExpand(node.name, e)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '0.5rem',
                fontSize: '1rem',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s',
              }}
              className="tree-arrow"
            >
              ▼
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, index) => {
              const childIsLast = index === node.children!.length - 1
              return renderNode(
                child,
                depth + 1,
                childIsLast,
                childVerticalLines
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'monospace', lineHeight: '1.8', fontSize: '1.2rem' }}>
      {renderNode(root)}
    </div>
  )
}

