import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export interface FolderItem {
  name: string
  path: string
  isFolder: boolean
  children?: FolderItem[]
}

export async function getFolderContents(folderPath: string): Promise<FolderItem[]> {
  try {
    const fullPath = join(process.cwd(), 'app', folderPath)
    const entries = await readdir(fullPath)
    
    const items: FolderItem[] = []
    
    for (const entry of entries) {
      // Skip hidden files and special directories
      if (entry.startsWith('.') || entry === 'node_modules') {
        continue
      }
      
      const entryPath = join(fullPath, entry)
      const entryStat = await stat(entryPath)
      
      if (entryStat.isDirectory()) {
        // Handle preface directories - they're leaf pages
        if (entry === 'preface') {
          const prefacePagePath = join(entryPath, 'page.tsx')
          try {
            await stat(prefacePagePath)
            items.push({
              name: 'preface',
              path: `/${folderPath}/preface`,
              isFolder: false
            })
          } catch {
            // No page.tsx in preface, skip
          }
          continue
        }
        
        // Regular directory - check if it's a folder or a page
        const itemPath = folderPath ? `${folderPath}/${entry}` : entry
        const webPath = `/${itemPath}`
        
        // Check if this directory has a page.tsx (it's a leaf page)
        const pagePath = join(entryPath, 'page.tsx')
        let hasPage = false
        try {
          await stat(pagePath)
          hasPage = true
        } catch {
          // No page.tsx
        }
        
        // Check if this directory has children (subdirectories or preface)
        const children = await getFolderContents(itemPath)
        const hasChildren = children.length > 0
        
        if (hasPage && !hasChildren) {
          // It's a leaf page
          items.push({
            name: entry,
            path: webPath,
            isFolder: false
          })
        } else if (hasChildren || !hasPage) {
          // It's a folder (has children or no page)
          items.push({
            name: entry,
            path: webPath,
            isFolder: true,
            children: children.length > 0 ? children : undefined
          })
        }
      }
    }
    
    return items.sort((a, b) => {
      // Folders first, then pages
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error('Error reading folder:', error)
    return []
  }
}

