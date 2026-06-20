const SITE_NAME = 'Bingo'

interface SeoOptions {
  title?: string
  description?: string
  /** og:type, defaults to 'website' */
  type?: string
}

/**
 * Build a meta array for a route's `head()`. Sets the document title plus
 * matching Open Graph and Twitter Card tags so links unfurl nicely.
 */
export function seo({ title, description, type = 'website' }: SeoOptions = {}) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME

  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { property: 'og:title', content: fullTitle },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: type },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: fullTitle },
  ]

  if (description) {
    meta.push(
      { name: 'description', content: description },
      { property: 'og:description', content: description },
      { name: 'twitter:description', content: description },
    )
  }

  return meta
}
