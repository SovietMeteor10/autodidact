'use client'

import Link from 'next/link'
import FilePathSegments from './FilePathSegments'

export interface FolderItem {
  name: string
  path: string
  isFolder: boolean
  children?: FolderItem[]
}

interface FolderViewProps {
  title: string
  description?: string | null
  parentPath: string
  contents: FolderItem[]
  filePath?: string
}

// Recursive function to render tree nodes
function renderTreeNode(node: FolderItem, isLast: boolean, depth: number, parentVerticalLines: string = ''): JSX.Element {
  const hasChildren = node.children && node.children.length > 0
  
  // Build the prefix string for tree connectors
  let currentLinePrefix = ''
  if (depth === 0) {
    // First level - just connector
    currentLinePrefix = isLast ? '└── ' : '├── '
  } else {
    // Deeper levels - include parent vertical lines
    currentLinePrefix = parentVerticalLines + (isLast ? '└── ' : '├── ')
  }
  
  // Calculate vertical lines to pass to children
  const childVerticalLines = parentVerticalLines + (isLast ? '    ' : '│   ')
  
  return (
    <div key={node.path}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        fontFamily: 'monospace',
        paddingLeft: depth > 0 ? '1.5rem' : '1.5rem',
        marginBottom: '0.25rem'
      }}>
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
      </div>
      {hasChildren && (
        <div>
          {node.children!.map((child, index) => {
            const childIsLast = index === node.children!.length - 1
            return renderTreeNode(child, childIsLast, depth + 1, childVerticalLines)
          })}
        </div>
      )}
    </div>
  )
}


export default function FolderView({ title, description, parentPath, contents, filePath }: FolderViewProps) {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Back button in left margin (desktop) or above title (mobile) */}
      <Link
        href={parentPath}
        className="folder-link back-button"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        ← Back
      </Link>
      
      {/* Header with title and file path */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', margin: 0 }}>{title.toLowerCase()}</h1>
        {filePath && (
          <div style={{ flex: '0 0 auto', flexShrink: 0 }}>
            <FilePathSegments filePath={filePath} />
          </div>
        )}
      </div>
      
      {/* Description if available */}
      {description && (
        <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
          <p style={{ fontSize: '1.1rem' }}>{description}</p>
        </div>
      )}
      
      {/* Tree view of folder contents */}
      {contents.length > 0 && (
        <div style={{ marginTop: '2rem', fontFamily: 'monospace', lineHeight: '1.8', fontSize: '1.2rem' }}>
          {contents.map((node, index) => {
            const isLast = index === contents.length - 1
            return renderTreeNode(node, isLast, 0)
          })}
        </div>
      )}
    </main>
  )
}

