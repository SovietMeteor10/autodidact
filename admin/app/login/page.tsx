export default function LoginPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ 
        padding: '2rem', 
        border: '1px solid #333', 
        borderRadius: '8px',
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#1a1a1a'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '1.5rem',
          textTransform: 'lowercase'
        }}>
          admin login
        </h1>
        <p style={{ color: '#999', marginBottom: '1rem', lineHeight: '1.6' }}>
          Authentication will be implemented here.
        </p>
        <p style={{ color: '#999', fontSize: '0.9rem', lineHeight: '1.6' }}>
          For now, set ALLOW_UNAUTHENTICATED=true in .env to bypass authentication.
        </p>
      </div>
    </div>
  )
}

