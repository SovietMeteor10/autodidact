import { notFound } from 'next/navigation'
import { getFolderContents } from '@/lib/getFolderContents'
import { getFolderDescription } from '@/lib/getFolderDescription'
import FolderView from '@/components/FolderView'

interface PageProps {
  params: {
    section: string
    path?: string[]
  }
}

// Force dynamic rendering - this route depends on JSON file at runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true
export const revalidate = 0

export default async function NestedFolderPage({ params }: PageProps) {
  const { section, path } = params
  
  if (!path || path.length === 0) {
    // This should be handled by [section]/page.tsx
    notFound()
    return
  }
  
  // Build the full folder path
  const folderPath = [section, ...path].join('/')
  
  // Get the folder contents from JSON
  const contents = await getFolderContents(folderPath)
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
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

