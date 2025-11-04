import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'

export interface FolderItem {
  name: string
  path: string
  isFolder: boolean
  children?: FolderItem[]
}

// Get the project root - try multiple possible locations
function getProjectRoot(): string {
  const cwd = process.cwd()
  console.log('[getProjectRoot] process.cwd():', cwd)
  
  // If we're in .next directory, go up one level
  if (cwd.includes('.next')) {
    const root = resolve(cwd, '..')
    console.log('[getProjectRoot] Adjusted from .next:', root)
    return root
  }
  
  // If we're in a standalone build, the app might be in a different location
  // Try to find the app directory
  const possibleRoots = [
    cwd,
    resolve(cwd, '..'),
    resolve(cwd, '../..'),
  ]
  
  for (const root of possibleRoots) {
    try {
      const appPath = join(root, 'app')
      // Check if app directory exists (this is async, but we'll handle it in the caller)
      return root
    } catch {
      continue
    }
  }
  
  return cwd
}

export async function getFolderContents(folderPath: string): Promise<FolderItem[]> {
  try {
    const projectRoot = getProjectRoot()
    const fullPath = join(projectRoot, 'app', folderPath)
    console.log('[getFolderContents] Reading folder:', fullPath)
    console.log('[getFolderContents] projectRoot:', projectRoot)
    console.log('[getFolderContents] process.cwd():', process.cwd())
    
    // Verify the directory exists before trying to read it
    try {
      await stat(fullPath)
    } catch (error) {
      console.error('[getFolderContents] Directory does not exist:', fullPath)
      throw error
    }
    
    const entries = await readdir(fullPath)
    console.log('[getFolderContents] Found entries:', entries.length)
    
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
    console.error('[getFolderContents] Error reading folder:', folderPath)
    const projectRoot = getProjectRoot()
    console.error('[getFolderContents] Full path attempted:', join(projectRoot, 'app', folderPath))
    console.error('[getFolderContents] Error details:', error)
    if (error instanceof Error) {
      console.error('[getFolderContents] Error message:', error.message)
      console.error('[getFolderContents] Error stack:', error.stack)
    }
    return []
  }
}

