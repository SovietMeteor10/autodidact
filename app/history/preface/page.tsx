import Link from 'next/link'
import FilePathSegments from '@/components/FilePathSegments'

export default function HistoryPreface() {
  const filePath = './history/preface'
  
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Back button in left margin (desktop) or above title (mobile) */}
      <Link
        href="/history"
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
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', margin: 0 }}>preface</h1>
        <div style={{ flex: '0 0 auto', flexShrink: 0 }}>
          <FilePathSegments filePath={filePath} />
        </div>
      </div>
      
      <article style={{ marginTop: '1rem', lineHeight: '1.8' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
        </p>
      </article>

    </main>
  )
}
