import { readdir, stat, writeFile } from 'fs/promises'
import { join } from 'path'

export interface FolderItem {
  name: string
  path: string
  isFolder: boolean
  children?: FolderItem[]
}

async function getFolderContents(folderPath: string, basePath: string): Promise<FolderItem[]> {
  try {
    const fullPath = join(basePath, folderPath)
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
        const children = await getFolderContents(itemPath, basePath)
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
    console.error(`Error reading folder ${folderPath}:`, error)
    return []
  }
}

async function getFolderDescription(folderPath: string, basePath: string): Promise<string | null> {
  try {
    const { readFile } = await import('fs/promises')
    const descPath = join(basePath, folderPath, 'description.md')
    const content = await readFile(descPath, 'utf-8')
    return content.trim()
  } catch {
    return null
  }
}

async function generateFolderStructure() {
  const appPath = join(process.cwd(), 'app')
  const outputPath = join(process.cwd(), 'lib', 'folderStructure.json')
  
  console.log('Generating folder structure from:', appPath)
  
  // Get all top-level sections
  const entries = await readdir(appPath)
  const sections: string[] = []
  
  for (const entry of entries) {
    // Skip files and special directories
    if (entry.startsWith('.') || 
        entry === 'node_modules' || 
        entry === 'globals.css' || 
        entry === 'layout.tsx' || 
        entry === 'not-found.tsx' || 
        entry === 'page.tsx' ||
        entry.startsWith('[') || // Skip dynamic routes like [section]
        entry.startsWith('(')) { // Skip route groups like (auth)
      continue
    }
    
    const entryPath = join(appPath, entry)
    const entryStat = await stat(entryPath)
    
    if (entryStat.isDirectory()) {
      sections.push(entry)
    }
  }
  
  // Generate folder structure for each section
  const folderStructure: Record<string, { contents: FolderItem[], description: string | null }> = {}
  
  // Also store nested paths
  const nestedPaths: Record<string, { contents: FolderItem[], description: string | null }> = {}
  
  // Recursively scan all nested folders
  async function scanNested(section: string, pathParts: string[] = []): Promise<void> {
    const fullPath = pathParts.length > 0 
      ? join(appPath, section, ...pathParts)
      : join(appPath, section)
    
    try {
      const entries = await readdir(fullPath)
      for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'preface') {
          continue
        }
        
        const entryPath = join(fullPath, entry)
        const entryStat = await stat(entryPath)
        
        if (entryStat.isDirectory()) {
          // Check if it's a page or a folder
          const pagePath = join(entryPath, 'page.tsx')
          let hasPage = false
          try {
            await stat(pagePath)
            hasPage = true
          } catch {
            // Not a page
          }
          
          if (!hasPage) {
            // It's a folder, scan it
            const newPath = [...pathParts, entry]
            const folderPath = `${section}/${newPath.join('/')}`
            const contents = await getFolderContents(folderPath, appPath)
            const description = await getFolderDescription(folderPath, appPath)
            
            nestedPaths[folderPath] = {
              contents,
              description
            }
            
            // Recursively scan children
            await scanNested(section, newPath)
          }
        }
      }
    } catch (error) {
      // Skip if we can't read
    }
  }
  
  for (const section of sections) {
    console.log(`Processing section: ${section}`)
    const contents = await getFolderContents(section, appPath)
    const description = await getFolderDescription(section, appPath)
    folderStructure[section] = { contents, description }
    
    // Scan nested paths for this section
    await scanNested(section)
  }
  
  // Write to JSON file with both sections and nested paths
  const output = {
    sections: folderStructure,
    nestedPaths: nestedPaths,
    generatedAt: new Date().toISOString()
  }
  
  await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`Folder structure written to: ${outputPath}`)
  console.log(`Generated structure for ${Object.keys(folderStructure).length} sections`)
  console.log(`Generated structure for ${Object.keys(nestedPaths).length} nested paths`)
}

generateFolderStructure().catch(console.error)

