// Confluence Tool Utility Functions
// Content format handling, caching, and helper functions

import type { 
  ContentFormat, 
  ContentBody, 
  ConfluencePage,
  ConfluenceSpace,
  ConfluenceAttachment,
  UserInfo,
  CacheStrategy 
} from './types'

// Content Format Conversion Functions

export function convertToStorageFormat(content: string, fromFormat: 'wiki' | 'html' | 'markdown'): string {
  switch (fromFormat) {
    case 'wiki':
      return convertWikiToStorage(content)
    case 'html':
      return convertHtmlToStorage(content)
    case 'markdown':
      return convertMarkdownToStorage(content)
    default:
      return content
  }
}

export function convertFromStorageFormat(content: string, toFormat: 'html' | 'text'): string {
  switch (toFormat) {
    case 'html':
      return convertStorageToHtml(content)
    case 'text':
      return convertStorageToText(content)
    default:
      return content
  }
}

// Wiki markup to Confluence storage format
function convertWikiToStorage(wikiContent: string): string {
  let storage = wikiContent
  
  // Headers
  storage = storage.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>')
  
  // Bold and italic
  storage = storage.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
  storage = storage.replace(/_([^_]+)_/g, '<em>$1</em>')
  
  // Links
  storage = storage.replace(/\[([^\]]+)\|([^\]]+)\]/g, '<a href="$2">$1</a>')
  storage = storage.replace(/\[([^\]]+)\]/g, '<a href="$1">$1</a>')
  
  // Lists
  storage = storage.replace(/^\*\s*(.+)$/gm, '<li>$1</li>')
  storage = storage.replace(/^#\s*(.+)$/gm, '<li>$1</li>')
  
  // Wrap in paragraphs if not already structured
  if (!storage.includes('<') || (!storage.includes('<p>') && !storage.includes('<h'))) {
    storage = `<p>${storage}</p>`
  }
  
  return storage
}

// HTML to Confluence storage format
function convertHtmlToStorage(htmlContent: string): string {
  // Basic HTML is mostly compatible with Confluence storage format
  // Just ensure it's well-formed XHTML
  let storage = htmlContent
  
  // Self-close empty tags
  storage = storage.replace(/<br>/g, '<br/>')
  storage = storage.replace(/<hr>/g, '<hr/>')
  storage = storage.replace(/<img([^>]+)>/g, '<img$1/>')
  
  // Ensure paragraphs are wrapped
  if (!storage.includes('<p>') && !storage.includes('<div>') && !storage.includes('<h')) {
    storage = `<p>${storage}</p>`
  }
  
  return storage
}

// Markdown to Confluence storage format
function convertMarkdownToStorage(markdownContent: string): string {
  let storage = markdownContent
  
  // Headers
  storage = storage.replace(/^#{6}\s*(.+)$/gm, '<h6>$1</h6>')
  storage = storage.replace(/^#{5}\s*(.+)$/gm, '<h5>$1</h5>')
  storage = storage.replace(/^#{4}\s*(.+)$/gm, '<h4>$1</h4>')
  storage = storage.replace(/^#{3}\s*(.+)$/gm, '<h3>$1</h3>')
  storage = storage.replace(/^#{2}\s*(.+)$/gm, '<h2>$1</h2>')
  storage = storage.replace(/^#{1}\s*(.+)$/gm, '<h1>$1</h1>')
  
  // Bold and italic
  storage = storage.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  storage = storage.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  storage = storage.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  storage = storage.replace(/_([^_]+)_/g, '<em>$1</em>')
  
  // Links
  storage = storage.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Code
  storage = storage.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Lists
  storage = storage.replace(/^\*\s*(.+)$/gm, '<li>$1</li>')
  storage = storage.replace(/^\-\s*(.+)$/gm, '<li>$1</li>')
  storage = storage.replace(/^\d+\.\s*(.+)$/gm, '<li>$1</li>')
  
  // Paragraphs
  const lines = storage.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (const line of lines) {
    if (line.trim() === '') {
      processedLines.push('')
      continue
    }
    
    if (line.includes('<li>')) {
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(line)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      
      if (!line.includes('<h') && !line.includes('<')) {
        processedLines.push(`<p>${line}</p>`)
      } else {
        processedLines.push(line)
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>')
  }
  
  return processedLines.join('\n')
}

// Storage format to HTML
function convertStorageToHtml(storageContent: string): string {
  // Storage format is already HTML-like, just clean it up
  return storageContent
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// Storage format to plain text
function convertStorageToText(storageContent: string): string {
  return storageContent
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Content Body Creation Functions

export function createContentBody(content: string, format: 'storage' | 'view' | 'wiki' = 'storage'): ContentBody {
  let storageContent: string
  
  if (format === 'storage') {
    storageContent = content
  } else {
    storageContent = convertToStorageFormat(content, format === 'wiki' ? 'wiki' : 'html')
  }
  
  const contentFormat: ContentFormat = {
    value: storageContent,
    representation: 'storage'
  }
  
  return {
    storage: contentFormat
  }
}

export function extractContentText(body?: ContentBody): string {
  if (!body) return ''
  
  // Prefer view format for display, fall back to storage
  const content = body.view?.value || body.storage?.value || ''
  
  if (body.view?.representation === 'view' || body.storage?.representation === 'storage') {
    return convertStorageToText(content)
  }
  
  return content
}

export function extractContentHtml(body?: ContentBody): string {
  if (!body) return ''
  
  // Prefer view format for display, fall back to storage
  const content = body.view?.value || body.storage?.value || ''
  
  if (body.storage?.representation === 'storage') {
    return convertStorageToHtml(content)
  }
  
  return content
}

// Formatting Helper Functions

export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString()
  } catch {
    return timestamp
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatUserInfo(user: UserInfo): string {
  if (user.displayName) return user.displayName
  if (user.publicName) return user.publicName
  if (user.email) return user.email
  if (user.accountId) return user.accountId
  return 'Unknown User'
}

export function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength - 3) + '...'
}

export function formatPageSummary(page: ConfluencePage): string {
  const lines = [
    `**${page.title}** (${page.id})`,
    `Space: ${page.space.name} (${page.space.key})`,
    `Status: ${page.status}`,
    `Type: ${page.type}`,
    `Version: ${page.version.number}`,
    `Created: ${formatTimestamp(page.metadata.created)} by ${formatUserInfo(page.metadata.createdBy)}`,
    `Modified: ${formatTimestamp(page.version.when)} by ${formatUserInfo(page.version.by)}`
  ]
  
  if (page.metadata.labels && page.metadata.labels.length > 0) {
    lines.push(`Labels: ${page.metadata.labels.map(l => l.name).join(', ')}`)
  }
  
  if (page.ancestors && page.ancestors.length > 0) {
    const breadcrumb = page.ancestors.map(a => a.title).join(' > ')
    lines.push(`Path: ${breadcrumb} > ${page.title}`)
  }
  
  return lines.join('\n')
}

export function formatSpaceSummary(space: ConfluenceSpace): string {
  const lines = [
    `**${space.name}** (${space.key})`,
    `Type: ${space.type}`,
    `Status: ${space.status}`
  ]
  
  if (space.description?.storage?.value) {
    const desc = truncateContent(extractContentText(space.description), 100)
    lines.push(`Description: ${desc}`)
  }
  
  if (space.homepage) {
    lines.push(`Homepage: ${space.homepage.title}`)
  }
  
  return lines.join('\n')
}

export function formatAttachmentSummary(attachment: ConfluenceAttachment): string {
  const lines = [
    `**${attachment.title}** (${attachment.id})`,
    `Type: ${attachment.metadata.mediaType}`,
    `Size: ${formatFileSize(attachment.metadata.fileSize)}`,
    `Created: ${formatTimestamp(attachment.metadata.created)} by ${formatUserInfo(attachment.metadata.createdBy)}`
  ]
  
  if (attachment.metadata.comment) {
    lines.push(`Comment: ${attachment.metadata.comment}`)
  }
  
  return lines.join('\n')
}

// Simple In-Memory Cache Implementation

class SimpleCache implements CacheStrategy {
  private cache = new Map<string, { value: any; expires: number }>()
  
  readonly pageTTL = 5 * 60 * 1000 // 5 minutes
  readonly spaceTTL = 15 * 60 * 1000 // 15 minutes
  readonly searchTTL = 60 * 1000 // 1 minute
  
  pageKey(pageId: string): string {
    return `page:${pageId}`
  }
  
  spaceKey(spaceKey: string): string {
    return `space:${spaceKey}`
  }
  
  searchKey(query: string): string {
    return `search:${query}`
  }
  
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value as T
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expires = Date.now() + (ttl || this.pageTTL)
    this.cache.set(key, { value, expires })
    
    // Simple cleanup - remove expired items when cache gets large
    if (this.cache.size > 1000) {
      this.cleanup()
    }
  }
  
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }
  
  async clear(): Promise<void> {
    this.cache.clear()
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const confluenceCache = new SimpleCache()

// Multi-instance Configuration Support

export function parseInstanceName(input: string): { instanceName?: string; cleanInput: string } {
  // Check if input starts with instance name pattern: @instanceName:
  const match = input.match(/^@([^:]+):(.*)$/)
  if (match) {
    return {
      instanceName: match[1],
      cleanInput: match[2].trim()
    }
  }
  
  return { cleanInput: input }
}

export function buildInstanceUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${cleanBase}${cleanEndpoint}`
}

// Validation Functions

export function validatePageTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Page title cannot be empty' }
  }
  
  if (title.length > 255) {
    return { valid: false, error: 'Page title cannot exceed 255 characters' }
  }
  
  // Confluence doesn't allow certain characters in titles
  const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
  for (const char of invalidChars) {
    if (title.includes(char)) {
      return { valid: false, error: `Page title cannot contain '${char}'` }
    }
  }
  
  return { valid: true }
}

export function validateSpaceKey(spaceKey: string): { valid: boolean; error?: string } {
  if (!spaceKey || spaceKey.trim().length === 0) {
    return { valid: false, error: 'Space key cannot be empty' }
  }
  
  // Space keys must be uppercase alphanumeric
  if (!/^[A-Z0-9]+$/.test(spaceKey)) {
    return { valid: false, error: 'Space key must contain only uppercase letters and numbers' }
  }
  
  if (spaceKey.length > 10) {
    return { valid: false, error: 'Space key cannot exceed 10 characters' }
  }
  
  return { valid: true }
}

export function validateContentSize(content: string): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const contentSize = new Blob([content]).size
  
  if (contentSize > maxSize) {
    return { 
      valid: false, 
      error: `Content size (${formatFileSize(contentSize)}) exceeds maximum allowed size (${formatFileSize(maxSize)})` 
    }
  }
  
  return { valid: true }
}
