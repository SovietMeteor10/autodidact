import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          margin: 0,
          lineHeight: 1
        }}>404</h1>
        <div style={{
          width: '1px',
          height: '2rem',
          backgroundColor: '#666',
          alignSelf: 'stretch'
        }} />
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          margin: 0
        }}>This page could not be found.</h2>
      </div>
      
      <Link 
        href="/" 
        style={{ 
          color: '#ffffff', 
          textDecoration: 'underline',
          fontSize: '1rem',
        }}
      >
        Return to Home
      </Link>
    </div>
  )
}

