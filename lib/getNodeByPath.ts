import { prisma } from './db'

/**
 * Finds a node by path using the path field for fast lookup
 * @param slugs - Array of slugs representing the path (e.g., ['about', 'preface'])
 * @returns The node at the end of the path, or null if not found
 */
export async function getNodeByPath(slugs: string[]) {
  if (slugs.length === 0) {
    return null
  }

  // Build path string from slugs (e.g., "about/preface")
  const path = slugs.join('/')

  // Use path field for fast indexed lookup
  const node = await prisma.node.findUnique({
    where: { path },
    include: {
      children: {
        orderBy: { order: 'asc' },
      },
    },
  })

  return node
}

/**
 * Gets all root nodes (top-level sections)
 */
export async function getRootNodes() {
  return prisma.node.findMany({
    where: {
      parentId: null,
    },
    include: {
      children: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })
}

/**
 * Builds a path array from a node by traversing up to root
 */
export async function getNodePath(nodeId: string): Promise<string[]> {
  const path: string[] = []
  let currentNode = await prisma.node.findUnique({
    where: { id: nodeId },
    include: { parent: true },
  })

  while (currentNode) {
    path.unshift(currentNode.slug)
    if (currentNode.parentId) {
      currentNode = await prisma.node.findUnique({
        where: { id: currentNode.parentId },
        include: { parent: true },
      })
    } else {
      break
    }
  }

  return path
}

