import Link from 'next/link'

export default function ExampleSubject() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Example Subject</h1>
      
      <p style={{ marginTop: '1rem', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
        This is an example subject page. You can add your own subjects by creating new folders
        in the <code style={{ background: '#333', padding: '0.2rem 0.4rem' }}>app/subjects/</code> directory.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Topics</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link 
              href="/notes/example" 
              style={{ 
                color: '#ffffff', 
                textDecoration: 'underline',
                fontSize: '1.1rem',
              }}
            >
              Example Notes
            </Link>
          </li>
        </ul>
      </section>

      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/" 
          style={{ 
            color: '#ffffff', 
            textDecoration: 'underline',
            fontSize: '1rem',
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}

