'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EditableNodeFields from './EditableNodeFields'

interface EditableChildNodeProps {
  child: {
    id: string
    title: string
    slug: string
    path: string
    content?: any
  }
}

export default function EditableChildNode({ child }: EditableChildNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Extract description from content
  const description = Array.isArray(child.content)
    ? child.content.find((block: any) => block.type === 'description' || (block.type === 'text' && block.isDescription))?.text || null
    : null

  return (
    <li style={{ marginBottom: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <a 
          href={`/admin/nodes/${child.id}`}
          style={{ 
            color: '#ffffff', 
            textDecoration: 'none',
            fontSize: '1.1rem',
            flex: 1
          }}
        >
          {child.title}
        </a>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            textTransform: 'lowercase',
            marginLeft: '1rem',
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
          {isExpanded ? 'collapse' : 'edit'}
        </button>
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '1rem', marginLeft: '1rem' }}>
          <EditableNodeFields
            nodeId={child.id}
            initialTitle={child.title}
            initialSlug={child.slug}
            initialPath={child.path}
            initialDescription={description}
          />
        </div>
      )}
    </li>
  )
}

