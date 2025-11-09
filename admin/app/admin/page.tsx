import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Verify authentication in server component (can use Prisma/NextAuth here)
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login?from=/admin')
  }
  // Fetch only root nodes with their child count
  const rootNodes = await prisma.node.findMany({
    where: { parentId: null },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      path: true,
      order: true,
    },
  })

  // Get child count for each root node
  const nodesWithChildCount = await Promise.all(
    rootNodes.map(async (node) => {
      const childCount = await prisma.node.count({
        where: { parentId: node.id },
      })
      return {
        ...node,
        childCount,
      }
    })
  )

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textTransform: 'lowercase' }}>
        admin dashboard
      </h1>
      
      <div style={{ marginBottom: '3rem' }}>
        <div
          style={{
            fontFamily: 'monospace',
            lineHeight: '1.8',
            fontSize: '1.2rem',
          }}
        >
          {nodesWithChildCount.map((node, index) => {
            const isLast = index === nodesWithChildCount.length - 1
            const connector = isLast ? '└── ' : '├── '
            
            return (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                  fontFamily: 'monospace',
                }}
              >
                <span
                  style={{
                    fontSize: '1.2rem',
                    color: '#ffffff',
                    marginRight: '0.5rem',
                    whiteSpace: 'pre',
                    fontFamily: 'monospace',
                    userSelect: 'none',
                  }}
                >
                  {connector}
                </span>
                <a
                  href={`/admin/nodes/${node.id}`}
                  style={{
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    fontFamily: 'var(--font-roboto-slab), serif',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {node.title.toLowerCase()}
                </a>
                {node.childCount > 0 && (
                  <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '1.2rem' }}>
                    ({node.childCount})
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

