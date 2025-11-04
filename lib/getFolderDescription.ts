import { readFile } from 'fs/promises'
import { join } from 'path'

// Cache for the folder structure (shared with getFolderContents)
let folderStructureCache: any = null

async function loadFolderStructure() {
  if (folderStructureCache) {
    return folderStructureCache
  }

  try {
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
        return structure
      } catch {
        continue
      }
    }

    return { sections: {}, nestedPaths: {} }
  } catch (error) {
    return { sections: {}, nestedPaths: {} }
  }
}

export async function getFolderDescription(folderPath: string): Promise<string | null> {
  try {
    const structure = await loadFolderStructure()
    
    // Check if it's a top-level section
    if (structure.sections && structure.sections[folderPath]) {
      return structure.sections[folderPath].description || null
    }
    
    // Check if it's a nested path
    if (structure.nestedPaths && structure.nestedPaths[folderPath]) {
      return structure.nestedPaths[folderPath].description || null
    }
    
    return null
  } catch {
    return null
  }
}

