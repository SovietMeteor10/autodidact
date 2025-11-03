export default function Footer() {
  return (
    <footer
      style={{
        padding: '2rem',
        textAlign: 'center',
        marginTop: 'auto',
      }}
    >
      <p style={{ fontSize: '0.9rem', color: '#ffffff' }}>
        Created by{' '}
        <a
          href="https://anthonyduncalf.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Anthony Duncalf
        </a>
      </p>
    </footer>
  )
}

