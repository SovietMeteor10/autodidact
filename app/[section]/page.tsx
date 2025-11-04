import { notFound } from 'next/navigation'
import { getFolderContents } from '@/lib/getFolderContents'
import { getFolderDescription } from '@/lib/getFolderDescription'
import FolderView from '@/components/FolderView'

interface PageProps {
  params: {
    section: string
  }
}

// Force dynamic rendering - this route depends on JSON file at runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true
export const revalidate = 0

export default async function SectionPage({ params }: PageProps) {
  const { section } = params
  
  // Get the folder contents from JSON
  const contents = await getFolderContents(section)
  
  // If no contents, this might not be a valid folder
  if (contents.length === 0) {
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

