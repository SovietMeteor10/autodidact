import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ContentRenderer } from "@/components/ContentRenderer";
import FilePathSegments from "@/components/FilePathSegments";
import BackButton from "@/components/BackButton";
import NodeTree from "@/components/NodeTree";

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

  // Use children already included in the query
  const children = node.children || [];

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

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      {/* Back button */}
      {fullPath.length > 1 && (
        <BackButton />
      )}
      
      {/* Header with title and file path */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <h1 className="page-title" style={{ fontSize: '2.5rem', margin: 0 }}>
          {node.title}
        </h1>
        <div style={{ flex: '0 0 auto', minWidth: 0 }}>
          <FilePathSegments filePath={filePath} />
        </div>
      </div>
      
      {/* Content area - render content (plain text or JSON blocks) */}
      <article style={{ marginTop: '1rem', lineHeight: '1.8' }}>
        {isPlainText ? (
          <ContentRenderer plainText={node.content as string} sources={sources} />
        ) : (
          <ContentRenderer blocks={contentBlocks} sources={sources} />
        )}
      </article>

      {/* Children navigation */}
      {children.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #333' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>
            Sections
          </h2>
          <NodeTree nodes={children} />
        </div>
      )}
    </main>
  );
}

