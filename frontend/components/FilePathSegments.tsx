'use client'

import Link from 'next/link'

export default function FilePathSegments({ filePath }: { filePath: string }) {
  // Remove leading ./
  const cleanPath = filePath.startsWith('./') ? filePath.slice(2) : filePath
  const segments = cleanPath.split('/')
  
  // Build paths for each segment
  const segmentPaths: string[] = []
  for (let i = 0; i < segments.length; i++) {
    segmentPaths.push('/' + segments.slice(0, i + 1).join('/'))
  }
  
  return (
    <div data-file-path style={{
      color: '#999',
      fontSize: '0.9rem',
      fontFamily: 'monospace',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.25rem',
      wordBreak: 'break-all'
    }}>
      <span style={{ color: '#999' }}>./</span>
      {segments.map((segment, index) => (
        <span key={index}>
          <Link
            href={segmentPaths[index]}
            className="folder-link"
            style={{
              color: '#999',
              textDecoration: 'none',
              transition: 'text-decoration 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            {segment}
          </Link>
          {index < segments.length - 1 && <span style={{ color: '#999' }}>/</span>}
        </span>
      ))}
    </div>
  )
}

