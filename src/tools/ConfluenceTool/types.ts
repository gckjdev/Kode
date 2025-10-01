// TypeScript interfaces and types for Confluence Tool
// Based on data-model.md specification

export interface ConfluenceInstance {
  baseUrl: string
  type: 'cloud' | 'server'
  email?: string
  username?: string
  apiToken?: string
  timeout?: number
  maxRetries?: number
}

export interface ConfluenceConfig {
  instances: Record<string, ConfluenceInstance>
  defaultInstance: string
}

// User and Profile Types
export interface UserInfo {
  type: 'known' | 'unknown' | 'anonymous'
  accountId?: string
  accountType?: 'atlassian' | 'app'
  email?: string
  publicName?: string
  displayName?: string
  profilePicture?: ProfilePicture
  isExternalCollaborator?: boolean
}

export interface ProfilePicture {
  path: string
  width: number
  height: number
  isDefault: boolean
}

export interface GroupInfo {
  type: 'group'
  name: string
  id?: string
}

// Content Format Types
export interface ContentFormat {
  value: string
  representation: string
  embeddedContent?: any[]
}

export interface ContentBody {
  storage?: ContentFormat
  view?: ContentFormat
  export_view?: ContentFormat
  styled_view?: ContentFormat
  editor?: ContentFormat
}

// Version and Metadata Types
export interface VersionInfo {
  number: number
  when: string
  by: UserInfo
  message?: string
  minorEdit: boolean
  syncRev?: string
  confRev?: string
}

export interface Label {
  prefix?: string
  name: string
  id?: string
  label?: string
}

// Page Types
export interface PageAncestor {
  id: string
  type: string
  status: string
  title: string
}

export interface PageChild {
  id: string
  type: string
  status: string
  title: string
  extensions?: Record<string, any>
}

export interface PageReference {
  id: string
  type: string
  status: string
  title: string
}

export interface PageMetadata {
  labels: Label[]
  properties: Record<string, any>
  frontend_url: string
  created: string
  createdBy: UserInfo
}

export interface RestrictionInfo {
  operation: string
  restrictions: {
    user?: UserInfo[]
    group?: GroupInfo[]
  }
}

export interface PageRestrictions {
  read?: RestrictionInfo
  update?: RestrictionInfo
}

export interface ConfluencePage {
  id: string
  type: 'page' | 'blogpost'
  status: 'current' | 'trashed' | 'historical' | 'draft'
  title: string
  space: SpaceInfo
  version: VersionInfo
  ancestors?: PageAncestor[]
  children?: PageChild[]
  body?: ContentBody
  metadata: PageMetadata
  restrictions?: PageRestrictions
  extensions?: Record<string, any>
}

// Space Types
export interface SpaceInfo {
  id: string
  key: string
  name: string
  type: string
  status: string
}

export interface SpaceMetadata {
  labels: Label[]
  created: string
  createdBy: UserInfo
}

export interface SpacePermissions {
  subjects: {
    user?: Record<string, string[]>
    group?: Record<string, string[]>
  }
}

export interface SpaceSettings {
  routeOverrideEnabled?: boolean
  editor?: string
  spaceDescription?: ContentBody
}

export interface ConfluenceSpace {
  id: string
  key: string
  name: string
  type: 'global' | 'personal'
  status: 'current' | 'archived'
  description?: ContentBody
  homepage?: PageReference
  metadata: SpaceMetadata
  permissions?: SpacePermissions
  settings?: SpaceSettings
}

// Attachment Types
export interface AttachmentMetadata {
  mediaType: string
  fileSize: number
  comment?: string
  created: string
  createdBy: UserInfo
}

export interface AttachmentExtensions {
  fileSize: number
  mediaType: string
  comment?: string
}

export interface ConfluenceAttachment {
  id: string
  type: 'attachment'
  status: string
  title: string
  version: VersionInfo
  container: PageReference
  metadata: AttachmentMetadata
  extensions: AttachmentExtensions
}

// Search Types
export interface SearchQuery {
  cql: string
  cqlcontext?: string
  excerpt?: 'indexed' | 'highlight' | 'none'
  expand?: string[]
  start?: number
  limit?: number
  includeArchivedSpaces?: boolean
}

export interface Breadcrumb {
  label: string
  url: string
  separator: string
}

export interface SearchResultItem {
  content: ConfluencePage | ConfluenceSpace | ConfluenceAttachment
  title: string
  excerpt?: string
  url: string
  resultGlobalContainer?: SpaceInfo
  breadcrumbs?: Breadcrumb[]
  entityType: 'content' | 'space' | 'attachment'
  iconCssClass?: string
  lastModified: string
  friendlyLastModified: string
}

export interface SearchResult {
  results: SearchResultItem[]
  start: number
  limit: number
  size: number
  totalSize: number
  cqlQuery: string
  searchDuration: number
}

// API Request/Response Types
export interface CreatePageRequest {
  type: 'page' | 'blogpost'
  title: string
  space: { key: string }
  body: {
    storage: {
      value: string
      representation: 'storage'
    }
  }
  ancestors?: Array<{ id: string }>
  metadata?: {
    labels?: Array<{ name: string }>
    properties?: Record<string, any>
  }
}

export interface UpdatePageRequest {
  version: { number: number }
  title?: string
  body?: {
    storage: {
      value: string
      representation: 'storage'
    }
  }
  metadata?: {
    labels?: Array<{ name: string }>
    properties?: Record<string, any>
  }
}

export interface ContentListOptions {
  type?: 'page' | 'blogpost'
  status?: 'current' | 'trashed' | 'historical' | 'draft'
  orderby?: 'title' | 'created' | 'modified'
  start?: number
  limit?: number
  expand?: string[]
}

export interface SearchOptions {
  spaceKey?: string
  type?: 'page' | 'blogpost' | 'attachment' | 'space'
  start?: number
  limit?: number
  excerpt?: 'indexed' | 'highlight' | 'none'
}

export interface AttachmentUpload {
  filename: string
  content: Buffer
  contentType: string
  comment?: string
}

export interface ListSpacesOptions {
  type?: 'global' | 'personal'
  status?: 'current' | 'archived'
  label?: string
  favourite?: boolean
  start?: number
  limit?: number
  expand?: string[]
}

// API Client Types
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string | Buffer
  timeout?: number
  retries?: number
}

export interface ApiResponse<T = any> {
  status: number
  statusText: string
  headers: Record<string, string>
  data: T
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string
  'X-RateLimit-Remaining': string
  'X-RateLimit-Reset': string
  'Retry-After': string
}

// Error Types
export enum ConfluenceErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  CONFLICT = 'conflict'
}

export interface ConfluenceApiError {
  statusCode: number
  message: string
  reason?: string
  errors?: Array<{
    field?: string
    message: string
  }>
}

export interface ConfluenceError extends Error {
  type: ConfluenceErrorType
  statusCode?: number
  response?: ApiResponse
  retryable: boolean
  userMessage: string
}

// Tool Input/Output Types
export interface ConfluenceToolInput {
  operation: 'get' | 'create' | 'update' | 'search' | 'list' | 'spaces' | 'attachments'
  instance?: string
  
  // For get, update operations
  pageId?: string
  pageTitle?: string
  spaceKey?: string
  
  // For create, update operations
  title?: string
  content?: string
  contentFormat?: 'storage' | 'view' | 'wiki'
  parentId?: string
  labels?: string[]
  
  // For search operations
  query?: string
  searchSpace?: string
  searchType?: 'page' | 'blogpost' | 'attachment' | 'space'
  
  // For list operations
  spaceKeys?: string[]
  contentType?: 'page' | 'blogpost'
  orderBy?: 'title' | 'created' | 'modified'
  
  // For attachment operations
  attachmentId?: string
  filename?: string
  
  // Common options
  expand?: string[]
  limit?: number
  start?: number
}

export interface ConfluenceToolOutput {
  operation: string
  success: boolean
  instance?: string
  
  // Single item results
  page?: ConfluencePage
  space?: ConfluenceSpace
  attachment?: ConfluenceAttachment
  
  // List results
  pages?: ConfluencePage[]
  spaces?: ConfluenceSpace[]
  attachments?: ConfluenceAttachment[]
  searchResults?: SearchResult
  
  // Metadata
  message?: string
  error?: string
  pagination?: {
    start: number
    limit: number
    size: number
    totalSize?: number
  }
}

// Cache Types
export interface CacheStrategy {
  pageKey(pageId: string): string
  spaceKey(spaceKey: string): string
  searchKey(query: string): string
  
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  
  pageTTL: number
  spaceTTL: number
  searchTTL: number
}

// Performance Types
export interface PerformanceRequirements {
  getPage: number
  createPage: number
  updatePage: number
  search: number
  listContent: number
  uploadAttachment: number
}

export interface MemoryContract {
  maxContentSize: number
  maxSearchResults: number
  maxListResults: number
  cacheSize: number
  cleanupInterval: number
  cleanupThreshold: number
}
