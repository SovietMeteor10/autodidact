import { PlainTextContentRenderer } from './PlainTextContentRenderer'
import { createHeadingNumberer } from '@/lib/headingNumberer'

interface ContentBlock {
  type: string
  text?: string
  items?: string[]
  url?: string
  [key: string]: any
}

interface Source {
  id: string
  name: string
  link: string
}

interface ContentRendererProps {
  blocks?: ContentBlock[]
  plainText?: string
  sources?: Source[]
}

export function ContentRenderer({ blocks, plainText, sources = [] }: ContentRendererProps) {
  // Handle plain text content (for child nodes)
  if (plainText !== undefined && plainText !== null) {
    return <PlainTextContentRenderer content={plainText} sources={sources} />
  }

  // Handle JSON blocks (for top/mid level nodes)
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null
  }

  // Create heading numberer for JSON blocks (default: numeric)
  const headingNumberer = createHeadingNumberer('numeric')

  return (
    <div className="prose" style={{ maxWidth: '100%' }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const number = headingNumberer.getNumber(1)
            return (
              <h1 key={i} style={{ fontSize: '2rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
                {number ? `${number}. ` : ''}{block.text}
              </h1>
            )
          }
          
          case 'heading2': {
            const number = headingNumberer.getNumber(2)
            return (
              <h2 key={i} style={{ fontSize: '1.5rem', marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                {number ? `${number}. ` : ''}{block.text}
              </h2>
            )
          }
          
          case 'heading3': {
            const number = headingNumberer.getNumber(3)
            return (
              <h3 key={i} style={{ fontSize: '1.25rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                {number ? `${number}. ` : ''}{block.text}
              </h3>
            )
          }
          
          case 'paragraph':
            return (
              <p key={i} style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.8' }}>
                {block.text}
              </p>
            )
          
          case 'quote':
            return (
              <blockquote
                key={i}
                style={{
                  borderLeft: '4px solid #666',
                  paddingLeft: '1rem',
                  margin: '1rem 0',
                  fontStyle: 'italic',
                  color: '#ccc',
                }}
              >
                {block.text}
              </blockquote>
            )
          
          case 'list':
            return (
              <ul key={i} style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                {block.items?.map((item, j) => (
                  <li key={j} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                    {item}
                  </li>
                ))}
              </ul>
            )
          
          case 'orderedList':
            return (
              <ol key={i} style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                {block.items?.map((item, j) => (
                  <li key={j} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>
                    {item}
                  </li>
                ))}
              </ol>
            )
          
          case 'embed':
            return (
              <div key={i} style={{ margin: '1.5rem 0' }}>
                <iframe
                  src={block.url}
                  className="w-full aspect-video rounded"
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '8px',
                    border: 'none',
                  }}
                  allowFullScreen
                />
              </div>
            )
          
          case 'code':
            return (
              <pre
                key={i}
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '1rem',
                }}
              >
                <code style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {block.text}
                </code>
              </pre>
            )
          
          default:
            return null
        }
      })}
    </div>
  )
}

