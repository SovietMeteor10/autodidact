import { z } from 'zod'

/**
 * Validation schemas for Node operations
 */

export const createNodeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  parentId: z.string().nullable().optional(),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
})

export const updateNodeSchema = z.object({
  id: z.string().min(1, 'Node id is required'),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  parentId: z.string().nullable().optional(),
  content: z.any().optional(),
  order: z.number().int().min(0).optional(),
})

export const deleteNodeSchema = z.object({
  id: z.string().min(1, 'Node id is required'),
  force: z.boolean().optional().default(false),
})

export const reorderNodesSchema = z.object({
  parentId: z.string().min(1, 'parentId is required'),
  orderedIds: z.array(z.string()).min(1, 'orderedIds must be a non-empty array'),
})

export const getNodeSchema = z.object({
  id: z.string().optional(),
  path: z.string().optional(),
}).refine(data => data.id || data.path, {
  message: 'Either id or path must be provided',
})

export const listNodesSchema = z.object({
  parentId: z.string().optional(),
})

export type CreateNodeInput = z.infer<typeof createNodeSchema>
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>
export type DeleteNodeInput = z.infer<typeof deleteNodeSchema>
export type ReorderNodesInput = z.infer<typeof reorderNodesSchema>
export type GetNodeInput = z.infer<typeof getNodeSchema>
export type ListNodesInput = z.infer<typeof listNodesSchema>

