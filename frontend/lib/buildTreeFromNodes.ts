import { Node } from '@prisma/client'

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

/**
 * Recursively builds a tree structure from flat node array
 */
function buildTreeRecursive(
  nodes: (Node & { children: Node[] })[],
  parentId: string | null = null
): TreeNode[] {
  return nodes
    .filter(node => node.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(node => {
      const path = parentId === null 
        ? `/${node.slug}`
        : buildPathFromNode(nodes, node.id)
      
      const children = buildTreeRecursive(nodes, node.id)
      
      return {
        name: node.title,
        path,
        ...(children.length > 0 && { children }),
      }
    })
}

/**
 * Builds the full path for a node by traversing up to root
 */
function buildPathFromNode(
  nodes: (Node & { children: Node[] })[],
  nodeId: string
): string {
  const path: string[] = []
  let currentNode = nodes.find(n => n.id === nodeId)
  
  while (currentNode) {
    path.unshift(currentNode.slug)
    if (currentNode.parentId) {
      currentNode = nodes.find(n => n.id === currentNode!.parentId)
    } else {
      break
    }
  }
  
  return '/' + path.join('/')
}

/**
 * Converts database nodes into a tree structure for the FileTree component
 */
export function buildTreeFromNodes(
  nodes: (Node & { children: Node[] })[]
): TreeNode {
  const rootChildren = buildTreeRecursive(nodes, null)
  
  return {
    name: 'Autodidacticism',
    path: '/',
    children: rootChildren,
  }
}

