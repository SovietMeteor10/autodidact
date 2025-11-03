import { notFound } from 'next/navigation'
import { getFolderContents } from '@/lib/getFolderContents'
import FolderView from '@/components/FolderView'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

interface PageProps {
  params: {
    section: string
    path?: string[]
  }
}

// Force dynamic rendering - this route depends on file system access at runtime
export const dynamic = 'force-dynamic'

// Get folder description from a description.md file if it exists
async function getFolderDescription(folderPath: string): Promise<string | null> {
  try {
    const descPath = join(process.cwd(), 'app', folderPath, 'description.md')
    const content = await readFile(descPath, 'utf-8')
    return content.trim()
  } catch {
    return null
  }
}

export default async function NestedFolderPage({ params }: PageProps) {
  const { section, path } = params
  
  if (!path || path.length === 0) {
    // This should be handled by [section]/page.tsx
    notFound()
    return
  }
  
  // Build the full folder path
  const folderPath = [section, ...path].join('/')
  
  // Check if this path corresponds to a page route first
  const lastSegment = path[path.length - 1]
  
  // Check if last segment is "preface" - this is a preface/page.tsx route
  if (lastSegment === 'preface') {
    const parentPath = path.length > 1 
      ? join(process.cwd(), 'app', section, ...path.slice(0, -1))
      : join(process.cwd(), 'app', section)
    const prefacePagePath = join(parentPath, 'preface', 'page.tsx')
    try {
      await stat(prefacePagePath)
      // This is a page route, not a folder - let Next.js handle it
      notFound()
      return
    } catch {
      // Not a preface page, continue
    }
  }
  
  // Check if there's a page.tsx directly at this path
  const pagePath = join(process.cwd(), 'app', section, ...path, 'page.tsx')
  try {
    await stat(pagePath)
    // This is a page route, not a folder - let Next.js handle it
    notFound()
    return
  } catch {
    // Not a direct page, continue
  }
  
  // Check if the directory exists
  const dirPath = join(process.cwd(), 'app', section, ...path)
  try {
    const dirStat = await stat(dirPath)
    if (!dirStat.isDirectory()) {
      notFound()
      return
    }
  } catch {
    // Directory doesn't exist
    notFound()
    return
  }
  
  // Get the folder contents
  const contents = await getFolderContents(folderPath)
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
    notFound()
  }
  
  // Get description if available
  const description = await getFolderDescription(folderPath)
  
  // Get parent path - go up one level
  let parentPath: string
  if (!path || path.length === 0) {
    // At section level, parent is home
    parentPath = '/'
  } else if (path.length === 1) {
    // One level deep, parent is section
    parentPath = `/${section}`
  } else {
    // Deeper, parent is section + path without last element
    parentPath = `/${[section, ...path.slice(0, -1)].join('/')}`
  }
  
  // Get folder name (last part of path)
  const folderName = path && path.length > 0 ? path[path.length - 1] : section
  const title = folderName.toLowerCase()
  const filePath = `./${folderPath}`
  
  return (
    <FolderView
      title={title}
      description={description}
      parentPath={parentPath}
      contents={contents}
      filePath={filePath}
    />
  )
}

