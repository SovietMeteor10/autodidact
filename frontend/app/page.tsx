import { prisma } from '@/lib/db'
import HomeTree from '@/components/HomeTree'

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

// Recursively build tree structure from database nodes
// This checks the database by looking at parentId relationships
function buildTree(
  nodes: Array<{ id: string; title: string; slug: string; path: string; parentId: string | null; order: number }>,
  parentId: string | null = null
): TreeNode[] {
  // Handle null comparison explicitly and ensure string comparison works
  const matchingNodes = nodes.filter(node => {
    if (parentId === null || parentId === undefined) {
      return node.parentId === null || node.parentId === undefined
    }
    // Ensure both are strings and compare
    return String(node.parentId) === String(parentId)
  })
  
  // Sort: "about" first, then alphabetical by title
  const sortedNodes = matchingNodes.sort((a, b) => {
    const aTitle = a.title.toLowerCase()
    const bTitle = b.title.toLowerCase()
    
    // Put "about" at the top
    if (aTitle === 'about' && bTitle !== 'about') return -1
    if (bTitle === 'about' && aTitle !== 'about') return 1
    
    // Then sort alphabetically
    return aTitle.localeCompare(bTitle)
  })
  
  return sortedNodes
    .map(node => {
      // Recursively find all children of this node by checking parentId
      const children = buildTree(nodes, node.id)
      const result: TreeNode = {
        name: node.title,
        path: node.path,
      }
      // Explicitly add children if they exist
      if (children.length > 0) {
        result.children = children
      }
      
      return result
    })
}

export default async function Home() {
  // Fetch ALL nodes from database (no include needed - we'll check parentId relationships)
  const allNodes = await prisma.node.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      path: true,
      parentId: true,
      order: true,
    },
    orderBy: { order: 'asc' },
  })

  // Build tree structure starting from root nodes (parentId is null)
  // This will recursively check the database relationships to find all children
  const rootNodes = buildTree(allNodes, null)

  // Create root node "Autodidacticism" with all root nodes as children
  const rootTree: TreeNode = {
    name: 'Autodidacticism',
    path: '/',
    children: rootNodes,
  }

  // Debug: Log to server console (check terminal, not browser)
  console.log('=== TREE BUILDING DEBUG ===')
  console.log('Total nodes fetched:', allNodes.length)
  console.log('Root nodes (parentId=null):', allNodes.filter(n => n.parentId === null).map(n => n.title))
  console.log('Nodes with children:', allNodes.map(n => ({
    title: n.title,
    id: n.id,
    childCount: allNodes.filter(child => child.parentId === n.id).length
  })).filter(n => n.childCount > 0))
  console.log('Root tree structure:', JSON.stringify(rootTree, null, 2))

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginTop: '1.5rem' }}>
        <HomeTree nodes={[rootTree]} />
      </div>
    </main>
  )
}

