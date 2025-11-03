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
  
  // Get the folder contents
  const contents = await getFolderContents(section)
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
    notFound()
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

