import { prisma } from './db'

/**
 * Builds a path string from parent path and slug
 */
export function makePath(parentPath: string | null, slug: string): string {
  const base = parentPath?.replace(/^\/|\/$/g, '') || ''
  const s = slug.replace(/^\/|\/$/g, '')
  return base ? `${base}/${s}` : s
}

/**
 * Calculates the path for a node based on its parent
 */
export async function calculateNodePath(
  slug: string,
  parentId: string | null
): Promise<string> {
  if (!parentId) {
    return slug
  }

  const parent = await prisma.node.findUnique({
    where: { id: parentId },
  })

  if (!parent) {
    throw new Error('Parent node not found')
  }

  return makePath(parent.path, slug)
}

/**
 * Updates paths for all descendants of a node
 */
export async function updateDescendantPaths(
  nodeId: string,
  newPath: string
): Promise<void> {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: { children: true },
  })

  if (!node) return

  // Update all children
  for (const child of node.children) {
    const childPath = makePath(newPath, child.slug)
    await prisma.node.update({
      where: { id: child.id },
      data: { path: childPath },
    })

    // Recursively update grandchildren
    await updateDescendantPaths(child.id, childPath)
  }
}

