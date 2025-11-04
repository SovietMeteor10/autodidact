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
export const runtime = 'nodejs'
export const dynamicParams = true
export const revalidate = 0

// Explicitly prevent static generation - return empty array to force all routes to be dynamic
export async function generateStaticParams() {
  return []
}

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
  
  console.log('[NestedFolderPage] Rendering section:', section, 'path:', path)
  console.log('[NestedFolderPage] process.cwd():', process.cwd())
  
  if (!path || path.length === 0) {
    // This should be handled by [section]/page.tsx
    console.log('[NestedFolderPage] No path, calling notFound()')
    notFound()
    return
  }
  
  // Build the full folder path
  const folderPath = [section, ...path].join('/')
  console.log('[NestedFolderPage] Full folder path:', folderPath)
  
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
  console.log('[NestedFolderPage] Checking directory:', dirPath)
  try {
    const dirStat = await stat(dirPath)
    if (!dirStat.isDirectory()) {
      console.log('[NestedFolderPage] Path exists but is not a directory')
      notFound()
      return
    }
    console.log('[NestedFolderPage] Directory exists, reading contents')
  } catch (error) {
    // Directory doesn't exist
    console.error('[NestedFolderPage] Directory does not exist:', dirPath)
    console.error('[NestedFolderPage] Error:', error)
    notFound()
    return
  }
  
  // Get the folder contents
  let contents
  try {
    contents = await getFolderContents(folderPath)
    console.log('[NestedFolderPage] Got contents:', contents.length, 'items')
  } catch (error) {
    console.error('[NestedFolderPage] Error getting folder contents:', error)
    notFound()
    return
  }
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
    console.log('[NestedFolderPage] No contents found, calling notFound()')
    notFound()
    return
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

