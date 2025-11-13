import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import EditableNodeFields from '@/components/EditableNodeFields'
import ChildrenList from '@/components/ChildrenList'
import AdminBackButton from '@/components/AdminBackButton'
import ChildNodeContentEditor from '@/components/ChildNodeContentEditor'
import NodeSourcesList from '@/components/NodeSourcesList'
import NodeTagsEditor from '@/components/NodeTagsEditor'

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export default async function EditNodePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const node = await prisma.node.findUnique({
    where: { id: params.id },
    include: {
      children: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          path: true,
          content: true,
        },
      },
      parent: {
        include: {
          parent: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!node) {
    notFound()
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <AdminBackButton />
      </div>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textTransform: 'lowercase' }}>
        edit node
      </h1>
      
      <EditableNodeFields
        nodeId={node.id}
        initialTitle={node.title}
        initialSlug={node.slug}
        initialPath={node.path}
        initialDescription={
          Array.isArray(node.content)
            ? (() => {
                const block = node.content.find((block: any) => block.type === 'description' || (block.type === 'text' && block.isDescription))
                return block && typeof block === 'object' && 'text' in block ? (block as any).text : null
              })()
            : null
        }
      />

      <NodeTagsEditor
        nodeId={node.id}
        initialTags={node.tags?.map((nodeTag) => ({
          id: nodeTag.tag.id,
          name: nodeTag.tag.name,
        })) || []}
      />

      {node.parent && (
        <div style={{ 
          backgroundColor: '#1a1a1a', 
          padding: '1.5rem', 
          borderRadius: '4px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#999', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Parent
            </strong>
            <a 
              href={`/admin/nodes/${node.parent.id}`}
              style={{ 
                color: '#ffffff', 
                textDecoration: 'none',
                fontSize: '1.1rem',
                textTransform: 'lowercase'
              }}
            >
              {node.parent.title.toLowerCase()}
            </a>
          </div>
        </div>
      )}

      {/* Content Editor for Child Nodes or Nodes with No Children */}
      {(node.parent && node.parent.parent) || node.children.length === 0 ? (
        <>
          <ChildNodeContentEditor
            nodeId={node.id}
            initialContent={
              typeof node.content === 'string' ? node.content : ''
            }
          />
          {typeof node.content === 'string' && (
            <NodeSourcesList content={node.content} />
          )}
        </>
      ) : null}
      
      <ChildrenList 
        children={node.children.map((child) => ({
          id: child.id,
          title: child.title,
          slug: child.slug,
          path: child.path,
        }))}
        parentId={node.id}
      />
    </div>
  )
}

