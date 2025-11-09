import { prisma } from './db'

/**
 * Get a node by path
 */
export async function getNode(path: string) {
  return prisma.node.findUnique({
    where: { path },
    include: {
      children: {
        orderBy: { order: 'asc' },
      },
      parent: {
        select: {
          id: true,
          title: true,
          slug: true,
          path: true,
        },
      },
    },
  })
}

/**
 * Get children of a node
 */
export async function getChildren(parentId: string | null) {
  return prisma.node.findMany({
    where: { parentId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      path: true,
      order: true,
    },
  })
}

/**
 * Get all root nodes (for homepage)
 */
export async function getRootNodes() {
  return prisma.node.findMany({
    where: { parentId: null },
    orderBy: { order: 'asc' },
    include: {
      children: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          path: true,
        },
      },
    },
  })
}

