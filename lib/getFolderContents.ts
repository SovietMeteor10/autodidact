import { readFile } from 'fs/promises'
import { join } from 'path'

export interface FolderItem {
  name: string
  path: string
  isFolder: boolean
  children?: FolderItem[]
}

// Cache for the folder structure
let folderStructureCache: any = null

async function loadFolderStructure(): Promise<{
  sections: Record<string, { contents: FolderItem[], description: string | null }>,
  nestedPaths: Record<string, { contents: FolderItem[], description: string | null }>
}> {
  if (folderStructureCache) {
    return folderStructureCache as any
  }

  try {
    // Try to load from the generated JSON file
    const possiblePaths = [
      join(process.cwd(), 'lib', 'folderStructure.json'),
      join(process.cwd(), '.next', 'lib', 'folderStructure.json'),
      join(process.cwd(), '..', 'lib', 'folderStructure.json'),
      join(__dirname, 'folderStructure.json'),
    ]

    for (const jsonPath of possiblePaths) {
      try {
        const content = await readFile(jsonPath, 'utf-8')
        const structure = JSON.parse(content)
        folderStructureCache = structure
        console.log('[getFolderContents] Loaded folder structure from:', jsonPath)
        return structure
      } catch {
        continue
      }
    }

    console.error('[getFolderContents] Could not find folderStructure.json in any expected location')
    console.error('[getFolderContents] Tried paths:', possiblePaths)
    return { sections: {}, nestedPaths: {} }
  } catch (error) {
    console.error('[getFolderContents] Error loading folder structure:', error)
    return { sections: {}, nestedPaths: {} }
  }
}

export async function getFolderContents(folderPath: string): Promise<FolderItem[]> {
  try {
    const structure = await loadFolderStructure()
    
    // Check if it's a top-level section
    if (structure.sections[folderPath]) {
      return structure.sections[folderPath].contents
    }
    
    // Check if it's a nested path
    if (structure.nestedPaths[folderPath]) {
      return structure.nestedPaths[folderPath].contents
    }
    
    // If it's a nested path, try to find it by traversing the structure
    const pathParts = folderPath.split('/')
    const section = pathParts[0]
    
    if (!structure.sections[section]) {
      console.log(`[getFolderContents] Section ${section} not found in structure`)
      return []
    }
    
    let current = structure.sections[section].contents
    
    // Traverse nested paths
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i]
      const found = current.find(item => item.name === part && item.isFolder)
      
      if (!found || !found.children) {
        console.log(`[getFolderContents] Path ${folderPath} not found in structure`)
        return []
      }
      
      current = found.children
    }
    
    return current || []
  } catch (error) {
    console.error('[getFolderContents] Error getting folder contents:', error)
    return []
  }
}
