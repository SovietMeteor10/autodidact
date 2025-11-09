import AdminNavIcons from '@/components/AdminNavIcons'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNavIcons />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}

