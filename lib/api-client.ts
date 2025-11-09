/**
 * API Client for Admin Frontend
 * 
 * This is a client-side wrapper for the admin API routes.
 * Use this in your separate admin frontend project.
 * 
 * Example usage:
 * ```ts
 * import { api } from '@/lib/api-client'
 * 
 * const nodes = await api.nodes.list({ parentId: 'abc123' })
 * const node = await api.nodes.get({ id: 'abc123' })
 * const created = await api.nodes.create({ title: 'New Page', slug: 'new-page' })
 * ```
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `API request failed: ${response.statusText}`)
    }

    return data
  }

  nodes = {
    /**
     * List all nodes or children of a specific parent
     */
    list: async (params?: { parentId?: string }) => {
      const query = params?.parentId ? `?parentId=${params.parentId}` : ''
      return this.request<any[]>(`/api/nodes/list${query}`)
    },

    /**
     * Get a single node by ID or path
     */
    get: async (params: { id?: string; path?: string }) => {
      const queryParams = new URLSearchParams()
      if (params.id) queryParams.append('id', params.id)
      if (params.path) queryParams.append('path', params.path)
      return this.request<any>(`/api/nodes/get?${queryParams.toString()}`)
    },

    /**
     * Create a new node
     */
    create: async (data: {
      title: string
      slug: string
      parentId?: string | null
      content?: any[]
      order?: number
    }) => {
      return this.request<any>('/api/nodes/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    /**
     * Update a node
     */
    update: async (data: {
      id: string
      title?: string
      slug?: string
      parentId?: string | null
      content?: any[]
      order?: number
    }) => {
      return this.request<any>('/api/nodes/update', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    /**
     * Delete a node
     */
    delete: async (data: { id: string; force?: boolean }) => {
      return this.request<{ success: boolean }>('/api/nodes/delete', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    /**
     * Reorder children of a parent node
     */
    reorder: async (data: {
      parentId: string
      orderedIds: string[]
    }) => {
      return this.request<{ children: any[] }>('/api/nodes/reorder', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  }
}

export const api = new ApiClient()

// Type exports for use in admin frontend
export type Node = {
  id: string
  title: string
  slug: string
  path: string
  parentId: string | null
  content: any[] | null
  order: number
  createdAt: Date
  updatedAt: Date
  children?: Node[]
  parent?: Node | null
}

export type CreateNodeInput = {
  title: string
  slug: string
  parentId?: string | null
  content?: any[]
  order?: number
}

export type UpdateNodeInput = {
  id: string
  title?: string
  slug?: string
  parentId?: string | null
  content?: any[]
  order?: number
}

