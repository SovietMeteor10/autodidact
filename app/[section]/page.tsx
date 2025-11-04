import { notFound } from 'next/navigation'
import { getFolderContents } from '@/lib/getFolderContents'
import FolderView from '@/components/FolderView'
import Link from 'next/link'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface PageProps {
  params: {
    section: string
  }
}

// Force dynamic rendering - this route depends on file system access at runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true
export const revalidate = 0

// Don't export generateStaticParams - this forces Next.js to render on-demand
// If we export it with an empty array, Next.js still tries to statically generate

// Get folder description from a description.md file if it exists
async function getFolderDescription(section: string): Promise<string | null> {
  try {
    const descPath = join(process.cwd(), 'app', section, 'description.md')
    const content = await readFile(descPath, 'utf-8')
    return content.trim()
  } catch {
    return null
  }
}

export default async function SectionPage({ params }: PageProps) {
  const { section } = params
  
  console.log('[SectionPage] Rendering section:', section)
  console.log('[SectionPage] process.cwd():', process.cwd())
  
  // Get the folder contents
  let contents
  try {
    contents = await getFolderContents(section)
    console.log('[SectionPage] Found contents:', contents.length, 'items')
  } catch (error) {
    console.error('[SectionPage] Error getting folder contents:', error)
    notFound()
    return
  }
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
    console.log('[SectionPage] No contents found, calling notFound()')
    notFound()
    return
  }
  
  // Get description if available
  const description = await getFolderDescription(section)
  
  // Get parent path (home for top-level sections)
  const parentPath = '/'
  const filePath = `./${section}`
  
  return (
    <FolderView
      title={section.toLowerCase()}
      description={description}
      parentPath={parentPath}
      contents={contents}
      filePath={filePath}
    />
  )
}

