'use client'

import { useMemo } from 'react'
import { parseContent, ParsedContentSegment } from '@/lib/contentParser'
import { numberCitations } from '@/lib/citationNumberer'
import { getEmbedUrl } from '@/lib/videoEmbed'

interface Source {
  id: string
  name: string
  link: string
}

interface PlainTextContentRendererProps {
  content: string
  sources: Source[]
}

// Union type for processed segments (includes bullet-list variant)
type ProcessedSegment = ParsedContentSegment | {
  type: 'bullet-list'
  content: null
  isBulletList: true
  bullets: string[]
}

export function PlainTextContentRenderer({
  content,
  sources,
}: PlainTextContentRendererProps) {
  const { parsed, citationMap, sourcesMap, sourcesByUrlMap } = useMemo(() => {
    const parsed = parseContent(content)
    const citationMap = numberCitations(parsed.citations)
    
    // Create a map of source names to source objects
    const sourcesMap = new Map<string, Source>()
    // Also create a map by URL for cases where citation name is a URL
    const sourcesByUrlMap = new Map<string, Source>()
    sources.forEach((source) => {
      sourcesMap.set(source.name, source)
      sourcesByUrlMap.set(source.link, source)
    })

    return { parsed, citationMap, sourcesMap, sourcesByUrlMap }
  }, [content, sources])

  // Get all unique citations in order for the citations list
  // Include all citations, even if they don't have a matching source
  const citationsList = useMemo(() => {
    return parsed.citations
      .map((name) => {
        // Try to find source by name first, then by URL (if citation name is a URL)
        let source = sourcesMap.get(name)
        if (!source && (name.startsWith('http://') || name.startsWith('https://'))) {
          source = sourcesByUrlMap.get(name)
        }
        const number = citationMap.get(name)
        return { name, number, source }
      })
  }, [parsed.citations, sourcesMap, sourcesByUrlMap, citationMap])

  // Group consecutive bullet points into lists
  const processedSegments = useMemo(() => {
    const result: ProcessedSegment[] = []
    let currentBulletList: string[] = []
    
    for (let i = 0; i < parsed.segments.length; i++) {
      const segment = parsed.segments[i]
      
      if (segment.type === 'bullet') {
        currentBulletList.push(segment.bulletText || '')
        // Check if next segment is also a bullet or if this is the last segment
        const nextSegment = parsed.segments[i + 1]
        if (!nextSegment || nextSegment.type !== 'bullet') {
          // End of bullet list
          result.push({
            type: 'bullet-list',
            content: null,
            isBulletList: true,
            bullets: [...currentBulletList],
          })
          currentBulletList = []
        }
      } else {
        result.push(segment)
      }
    }
    
    return result
  }, [parsed.segments])

  return (
    <div style={{ lineHeight: '1.8' }}>
      {/* Render content segments */}
      <div style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        {processedSegments.map((segment, index) => {
          if (segment.type === 'text') {
            return (
              <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
                {segment.content}
              </span>
            )
          } else if (segment.type === 'heading') {
            return (
              <h1
                key={index}
                style={{
                  fontSize: '2rem',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                {segment.headingText}
              </h1>
            )
          } else if (segment.type === 'subheading') {
            return (
              <h2
                key={index}
                style={{
                  fontSize: '1.5rem',
                  marginTop: '1.25rem',
                  marginBottom: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {segment.headingText}
              </h2>
            )
          } else if (segment.type === 'subsubheading') {
            return (
              <h3
                key={index}
                style={{
                  fontSize: '1.25rem',
                  marginTop: '1rem',
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                }}
              >
                {segment.headingText}
              </h3>
            )
          } else if (segment.type === 'bullet-list' && 'bullets' in segment) {
            return (
              <ul
                key={index}
                style={{
                  marginBottom: '1rem',
                  paddingLeft: '1.5rem',
                  listStyleType: 'disc',
                }}
              >
                {segment.bullets.map((bullet, bulletIndex) => (
                  <li
                    key={bulletIndex}
                    style={{
                      marginBottom: '0.5rem',
                      lineHeight: '1.6',
                    }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            )
          } else if (segment.type === 'citation') {
            const citationName = segment.citationName || ''
            const number = citationMap.get(citationName)
            // Try to find source by name first, then by URL
            let source = citationName ? sourcesMap.get(citationName) : null
            if (!source && citationName && (citationName.startsWith('http://') || citationName.startsWith('https://'))) {
              source = sourcesByUrlMap.get(citationName)
            }

            if (number) {
              const linkUrl = source ? source.link : (citationName.startsWith('http://') || citationName.startsWith('https://') ? citationName : null)
              
              if (linkUrl) {
                return (
                  <a
                    key={index}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#999',
                      fontSize: '0.85em',
                      marginLeft: '0.2em',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    title={linkUrl}
                  >
                    [{number}]
                  </a>
                )
              } else {
                // If no link available, scroll to sources section
                return (
                  <a
                    key={index}
                    href={`#source-${number}`}
                    style={{
                      color: '#999',
                      fontSize: '0.85em',
                      marginLeft: '0.2em',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                    title={citationName}
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.getElementById(`source-${number}`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                  >
                    [{number}]
                  </a>
                )
              }
            }
            return null
          } else if (segment.type === 'embed') {
            const embedUrl = segment.embedUrl ? getEmbedUrl(segment.embedUrl) : null

            if (embedUrl) {
              return (
                <div
                  key={index}
                  style={{
                    margin: '2rem auto',
                    width: '66.67%',
                    maxWidth: '800px',
                    padding: '0 1rem',
                  }}
                >
                  <iframe
                    src={embedUrl}
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: '8px',
                      border: 'none',
                    }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="eager"
                  />
                </div>
              )
            }

            // If embed URL is invalid, show as link
            return (
              <a
                key={index}
                href={segment.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#999',
                  textDecoration: 'underline',
                  margin: '0 0.25em',
                }}
              >
                {segment.embedUrl}
              </a>
            )
          } else if (segment.type === 'link') {
            return (
              <a
                key={index}
                href={segment.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#ffffff',
                  textDecoration: 'underline',
                  margin: '0 0.2em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {segment.linkText}
              </a>
            )
          } else if (segment.type === 'tag') {
            // Convert tag path to URL
            // Path could be: "about/philosophy", "/about/philosophy", or just "philosophy"
            let tagUrl = segment.tagPath || ''
            // Remove leading slash if present
            if (tagUrl.startsWith('/')) {
              tagUrl = tagUrl.slice(1)
            }
            // Ensure it starts with / for internal link
            if (!tagUrl.startsWith('http://') && !tagUrl.startsWith('https://')) {
              tagUrl = '/' + tagUrl
            }
            
            return (
              <a
                key={index}
                href={tagUrl}
                style={{
                  color: '#ffffff',
                  textDecoration: 'underline',
                  margin: '0 0.2em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                {segment.tagPath}
              </a>
            )
          }
          return null
        })}
      </div>

      {/* Citations list - show if there are any citations */}
      {parsed.citations.length > 0 && citationsList.length > 0 && (
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid #333',
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              marginBottom: '1rem',
              color: '#999',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Sources
          </h3>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {citationsList.map((item) => (
              <li
                key={item.name}
                id={`source-${item.number}`}
                style={{
                  marginBottom: '0.75rem',
                  paddingLeft: '1.5rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: '#999',
                    fontWeight: 500,
                  }}
                >
                  [{item.number}]
                </span>
                {item.source ? (
                  <a
                    href={item.source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#ffffff',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {item.source.link}
                  </a>
                ) : (
                  // If no source found, show the citation name (might be a URL) with same styling
                  <a
                    href={item.name.startsWith('http://') || item.name.startsWith('https://') ? item.name : '#'}
                    target={item.name.startsWith('http://') || item.name.startsWith('https://') ? '_blank' : undefined}
                    rel={item.name.startsWith('http://') || item.name.startsWith('https://') ? 'noopener noreferrer' : undefined}
                    style={{
                      color: '#ffffff',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                  >
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

