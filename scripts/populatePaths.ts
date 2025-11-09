import { prisma } from '../lib/db'

/**
 * Populates the path field for all existing nodes
 * This is a one-time migration script
 */
async function populatePaths() {
  console.log('Starting path population...')

  // Get all nodes
  const nodes = await prisma.node.findMany({
    include: { parent: true },
  })

  console.log(`Found ${nodes.length} nodes to process`)

  // Build a map of node ID to node for quick lookup
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  // Function to build path recursively
  function buildPath(nodeId: string, visited: Set<string> = new Set()): string {
    if (visited.has(nodeId)) {
      throw new Error(`Circular reference detected at node ${nodeId}`)
    }
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    if (!node.parentId) {
      // Root node
      return node.slug
    }

    // Recursively build parent path
    const parentPath = buildPath(node.parentId, visited)
    return `${parentPath}/${node.slug}`
  }

  // Update each node's path
  let updated = 0
  for (const node of nodes) {
    try {
      const path = buildPath(node.id)
      
      await prisma.node.update({
        where: { id: node.id },
        data: { path },
      })

      updated++
      if (updated % 10 === 0) {
        console.log(`Updated ${updated}/${nodes.length} nodes...`)
      }
    } catch (error) {
      console.error(`Error updating node ${node.id} (${node.title}):`, error)
    }
  }

  console.log(`\n✅ Successfully updated ${updated}/${nodes.length} nodes`)
  console.log('Path population complete!')
}

populatePaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

