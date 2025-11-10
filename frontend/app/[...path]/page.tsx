import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ContentRenderer } from "@/components/ContentRenderer";
import FilePathSegments from "@/components/FilePathSegments";
import BackButton from "@/components/BackButton";
import FolderTree from "@/components/FolderTree";

// Force dynamic rendering - don't try to statically generate pages that query the database
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
}

async function findNodeByPath(segments: string[]) {
  const fullPath = segments.join("/");
  return prisma.node.findUnique({
    where: { path: fullPath },
    include: {
      children: {
        orderBy: { order: "asc" },
        include: {
          children: {
            orderBy: { order: "asc" },
            include: {
              children: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });
}

// Convert Prisma node children structure to TreeNode format
// This recursively converts the nested children structure from the database query
function convertNodeChildrenToTree(
  children: Array<{
    id: string;
    title: string;
    path: string;
    children: any[];
  }>
): TreeNode[] {
  return children.map(child => {
    const result: TreeNode = {
      name: child.title,
      path: child.path,
    };
    
    // Recursively convert nested children if they exist
    if (child.children && Array.isArray(child.children) && child.children.length > 0) {
      result.children = convertNodeChildrenToTree(child.children);
    }
    
    return result;
  });
}

export default async function Page({ params }: { params: { path?: string[] } }) {
  // Root case: /
  if (!params.path || params.path.length === 0) {
    // Redirect to homepage or show welcome screen
    return (
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to Autodidact</h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>Choose a section from the navigation.</p>
      </main>
    );
  }

  const segments = params.path;

  // Ignore requests for static assets
  const ext = segments[segments.length - 1]?.split(".").pop();
  const staticExts = ["png", "jpg", "jpeg", "ico", "svg", "webp", "gif", "css", "js"];
  if (ext && staticExts.includes(ext.toLowerCase())) {
    return notFound();
  }

  const node = await findNodeByPath(segments);

  if (!node) {
    return notFound();
  }

  // Fetch sources for citations
  const sources = await prisma.source.findMany({
    orderBy: { name: 'asc' },
  });

  // Convert current node's children to tree structure
  // node.children is already fetched with nested structure via the include clause
  const treeNodes = node.children && node.children.length > 0
    ? convertNodeChildrenToTree(node.children)
    : []

  // Determine content type: string (plain text) or array (JSON blocks)
  const isPlainText = typeof node.content === 'string';
  const contentBlocks = Array.isArray(node.content) 
    ? node.content 
    : node.content && !isPlainText
      ? [node.content] 
      : [];

  // Build paths for navigation
  const fullPath = segments;
  const filePath = './' + fullPath.join('/');
  const parentPath = fullPath.length > 1 
    ? '/' + fullPath.slice(0, -1).join('/')
    : '/';

  // Get description from content blocks if available
  // Look for description block (with isDescription: true or type: 'description')
  let description: string | null = null
  if (contentBlocks.length > 0) {
    const descriptionBlock = contentBlocks.find((block: any) => 
      block.isDescription === true || block.type === 'description'
    )
    if (descriptionBlock && typeof descriptionBlock === 'object' && 'text' in descriptionBlock) {
      const textValue = (descriptionBlock as any).text
      description = typeof textValue === 'string' ? textValue : null
    }
  }
  
  // Filter out description block and default placeholder content
  const contentBlocksWithoutDescription = contentBlocks.filter((block: any) => {
    // Filter out description blocks
    if (block.isDescription === true || block.type === 'description') {
      return false
    }
    
    // Get text content from block
    const blockText = block.text || ''
    const lowerText = blockText.toLowerCase()
    
    // Filter out welcome messages and generic placeholders
    if (block.type === 'text' || block.type === 'paragraph') {
      if (
        (lowerText.includes('welcome to') && lowerText.includes('section')) ||
        lowerText.includes('this is the preface for') ||
        lowerText.includes('more content coming soon') ||
        lowerText.includes('coming soon') ||
        lowerText.includes('placeholder') ||
        lowerText.trim() === ''
      ) {
        return false
      }
    }
    
    // Filter out duplicate headings that match the page title or contain separator
    // This applies to ALL heading types
    if (block.type === 'heading' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'heading4' || block.type === 'heading5' || block.type === 'heading6') {
      const headingText = (block.text || '').trim()
      const lowerHeading = headingText.toLowerCase().trim()
      const lowerTitle = node.title.toLowerCase().trim()
      
      // Filter out if it matches the page title exactly
      if (lowerHeading === lowerTitle) {
        return false
      }
      
      // For leaf pages (pages without children), filter out ANY heading with a separator
      // This removes duplicate headings like "Theology – Preface", "Philosophy – Preface", etc.
      const isLeafPage = !node.children || node.children.length === 0
      const hasSeparator = /[–—-]/.test(headingText)
      
      if (hasSeparator) {
        // On leaf pages, remove ALL headings with separators (they're likely duplicates)
        if (isLeafPage) {
          return false
        }
        
        // On folder pages, only filter if it contains the page title
        if (lowerHeading.includes(lowerTitle)) {
          return false
        }
        
        // Also check if the heading ends with the page title after a separator
        const separatorPattern = /[–—-]\s*/i
        const parts = headingText.split(separatorPattern)
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1].toLowerCase().trim()
          if (lastPart === lowerTitle) {
            return false
          }
        }
      }
    }
    
    return true
  })

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Header with back button, title, and file path */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        {/* Back button and file path row - top row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          {/* Back button - top left (show on all pages except root) - only element in top-left */}
          <div style={{ flex: '0 0 auto' }}>
            {segments.length > 0 && (
              <BackButton />
            )}
          </div>
          {/* File path - top right */}
          <div style={{ flex: '0 0 auto', minWidth: 0, marginLeft: 'auto' }}>
            <FilePathSegments filePath={filePath} />
          </div>
        </div>
        
        {/* Title - below the back button/file path row */}
        <h1 className="page-title" style={{ fontSize: '2.5rem', margin: 0, marginTop: '0.5rem' }}>
          {node.title.toLowerCase()}
        </h1>
        
        {/* Description - below the title */}
        {description && (
          <p style={{ 
            fontSize: '1.1rem', 
            marginTop: '1rem', 
            lineHeight: '1.8',
            color: '#ccc'
          }}>
            {description}
          </p>
        )}
      </div>
      
      {/* Content area - render content (plain text or JSON blocks) */}
      {isPlainText ? (
        node.content && (
          <article style={{ marginTop: '1rem', lineHeight: '1.8' }}>
            <ContentRenderer plainText={node.content as string} sources={sources} />
          </article>
        )
      ) : (
        contentBlocksWithoutDescription.length > 0 && (
          <article style={{ marginTop: '1rem', lineHeight: '1.8' }}>
            <ContentRenderer blocks={contentBlocksWithoutDescription as any} sources={sources} />
          </article>
        )
      )}

      {/* Sections with tree structure - no "Sections" heading, just the tree */}
      {/* Only show tree if current node has children */}
      {node.children && node.children.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <FolderTree nodes={treeNodes} />
        </div>
      )}
    </main>
  );
}

