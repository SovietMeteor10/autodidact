/**
 * Video embed utilities
 * Converts video URLs to embeddable iframe URLs
 */

/**
 * Convert a video URL to an embeddable iframe URL
 * Supports YouTube, Vimeo, and other common platforms
 */
export function getEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId: string | null = null

      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1)
      } else if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v')
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1]
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }

    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').filter(Boolean).pop()
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`
      }
    }

    // Return original URL if not a supported platform
    // Frontend can handle it as a regular iframe or link
    return url
  } catch (error) {
    // Invalid URL, return null
    return null
  }
}

