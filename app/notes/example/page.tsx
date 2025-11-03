import Link from 'next/link'

export default function ExampleNotes() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Example Notes</h1>
      
      <article style={{ marginTop: '1rem', lineHeight: '1.8' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          This is an example notes page. You can add your own notes by creating new folders
          in the <code style={{ background: '#333', padding: '0.2rem 0.4rem' }}>app/notes/</code> directory.
        </p>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Notes Content</h2>
          <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            Add your notes content here. You can use markdown-style formatting, 
            code blocks, lists, and any other content you need.
          </p>
          
          <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Key point 1</li>
            <li style={{ marginBottom: '0.5rem' }}>Key point 2</li>
            <li style={{ marginBottom: '0.5rem' }}>Key point 3</li>
          </ul>
        </section>
      </article>

      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/subjects/example" 
          style={{ 
            color: '#ffffff', 
            textDecoration: 'underline',
            fontSize: '1rem',
            marginRight: '1rem',
          }}
        >
          ← Back to Subject
        </Link>
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

