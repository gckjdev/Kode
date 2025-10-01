# Data Model: Confluence Tool

**Feature**: Confluence Tool Integration  
**Date**: 2025-01-02  
**Status**: Complete

## Entity Definitions

### ConfluenceConfig
Configuration for Confluence instances and authentication.

```typescript
interface ConfluenceConfig {
  instances: Record<string, ConfluenceInstance>
  defaultInstance: string
}

interface ConfluenceInstance {
  baseUrl: string           // Confluence base URL
  type: 'cloud' | 'server'  // Instance type
  email?: string            // For Cloud authentication
  username?: string         // For Server authentication  
  apiToken?: string         // API token or password
  timeout?: number          // Request timeout (default: 30s)
  maxRetries?: number       // Max retry attempts (default: 3)
}
```

### Page Entity
Represents a Confluence page with content and metadata.

```typescript
interface ConfluencePage {
  id: string                // Unique page ID
  type: 'page' | 'blogpost' // Content type
  status: 'current' | 'trashed' | 'historical' | 'draft'
  title: string             // Page title
  space: SpaceInfo          // Parent space information
  version: VersionInfo      // Version and history
  ancestors?: PageAncestor[] // Parent pages in hierarchy
  children?: PageChild[]    // Child pages
  body?: ContentBody        // Page content in various formats
  metadata: PageMetadata    // Additional page information
  restrictions?: PageRestrictions // Access restrictions
  extensions?: Record<string, any> // Custom extensions
}

interface ContentBody {
  storage?: ContentFormat   // Storage format (for editing)
  view?: ContentFormat      // View format (for display)
  export_view?: ContentFormat // Export format
  styled_view?: ContentFormat // Styled view format
  editor?: ContentFormat    // Editor format
}

interface ContentFormat {
  value: string             // Content body
  representation: string   // Format type
  embeddedContent?: any[]   // Embedded content references
}

interface VersionInfo {
  number: number            // Version number
  when: string              // ISO timestamp
  by: UserInfo              // User who made the change
  message?: string          // Version comment
  minorEdit: boolean        // Whether this was a minor edit
  syncRev?: string          // Synchronization revision
  confRev?: string          // Confluence revision
}

interface PageMetadata {
  labels: Label[]           // Page labels/tags
  properties: Record<string, any> // Custom properties
  frontend_url: string      // Web UI URL
  created: string           // Creation timestamp
  createdBy: UserInfo       // Creator information
}

interface PageAncestor {
  id: string
  type: string
  status: string
  title: string
}

interface PageChild {
  id: string
  type: string
  status: string
  title: string
  extensions?: Record<string, any>
}
```

### Space Entity
Represents a Confluence space containing pages and configuration.

```typescript
interface ConfluenceSpace {
  id: string                // Unique space ID
  key: string               // Space key (short identifier)
  name: string              // Human-readable space name
  type: 'global' | 'personal' // Space type
  status: 'current' | 'archived' // Space status
  description?: ContentBody // Space description
  homepage?: PageReference  // Default homepage
  metadata: SpaceMetadata   // Additional space information
  permissions?: SpacePermissions // Access permissions
  settings?: SpaceSettings  // Space configuration
}

interface SpaceMetadata {
  labels: Label[]           // Space labels
  created: string           // Creation timestamp
  createdBy: UserInfo       // Creator information
}

interface SpaceInfo {
  id: string
  key: string
  name: string
  type: string
  status: string
}

interface PageReference {
  id: string
  type: string
  status: string
  title: string
}
```

### Attachment Entity
Represents file attachments on Confluence pages.

```typescript
interface ConfluenceAttachment {
  id: string                // Unique attachment ID
  type: 'attachment'        // Content type
  status: string            // Attachment status
  title: string             // Filename
  version: VersionInfo      // Version information
  container: PageReference  // Parent page
  metadata: AttachmentMetadata // File information
  extensions: AttachmentExtensions // Download links
}

interface AttachmentMetadata {
  mediaType: string         // MIME type
  fileSize: number          // Size in bytes
  comment?: string          // Upload comment
  created: string           // Upload timestamp
  createdBy: UserInfo       // Uploader information
}

interface AttachmentExtensions {
  fileSize: number
  mediaType: string
  comment?: string
}
```

### User Entity
Represents Confluence users and their information.

```typescript
interface UserInfo {
  type: 'known' | 'unknown' | 'anonymous'
  accountId?: string        // Unique account ID (Cloud)
  accountType?: 'atlassian' | 'app' // Account type
  email?: string            // User email
  publicName?: string       // Display name
  displayName?: string      // Full display name
  profilePicture?: ProfilePicture // Avatar information
  isExternalCollaborator?: boolean // External user flag
}

interface ProfilePicture {
  path: string              // Avatar URL path
  width: number             // Image width
  height: number            // Image height
  isDefault: boolean        // Whether using default avatar
}
```

### Search Entity
Represents search queries and results.

```typescript
interface SearchQuery {
  cql: string               // Confluence Query Language
  cqlcontext?: string       // Search context
  excerpt?: 'indexed' | 'highlight' | 'none' // Excerpt type
  expand?: string[]         // Fields to expand
  start?: number            // Pagination start
  limit?: number            // Results per page
  includeArchivedSpaces?: boolean // Include archived content
}

interface SearchResult {
  results: SearchResultItem[]
  start: number             // Pagination start
  limit: number             // Results per page  
  size: number              // Total results count
  totalSize: number         // Total available results
  cqlQuery: string          // Executed query
  searchDuration: number    // Search time in ms
}

interface SearchResultItem {
  content: ConfluencePage | ConfluenceSpace | ConfluenceAttachment
  title: string             // Result title
  excerpt?: string          // Content excerpt
  url: string               // Web URL
  resultGlobalContainer?: SpaceInfo // Container space
  breadcrumbs?: Breadcrumb[] // Navigation breadcrumbs
  entityType: 'content' | 'space' | 'attachment'
  iconCssClass?: string     // UI icon class
  lastModified: string      // Last modification date
  friendlyLastModified: string // Human-readable date
}

interface Breadcrumb {
  label: string
  url: string
  separator: string
}
```

### Common Types
Shared types used across entities.

```typescript
interface Label {
  prefix?: string           // Label namespace
  name: string              // Label name
  id?: string               // Label ID
  label?: string            // Display label
}

interface PageRestrictions {
  read?: RestrictionInfo    // Read restrictions
  update?: RestrictionInfo  // Update restrictions
}

interface RestrictionInfo {
  operation: string         // Operation type
  restrictions: {
    user?: UserInfo[]       // Restricted users
    group?: GroupInfo[]     // Restricted groups
  }
}

interface GroupInfo {
  type: 'group'
  name: string              // Group name
  id?: string               // Group ID
}

interface SpacePermissions {
  subjects: {
    user?: Record<string, string[]>   // User permissions
    group?: Record<string, string[]>  // Group permissions
  }
}

interface SpaceSettings {
  routeOverrideEnabled?: boolean
  editor?: string
  spaceDescription?: ContentBody
}
```

## Tool Input/Output Models

### Tool Input Schema
```typescript
interface ConfluenceToolInput {
  operation: 'get' | 'create' | 'update' | 'search' | 'list' | 'spaces' | 'attachments'
  instance?: string         // Instance name (default: 'default')
  
  // For get, update operations
  pageId?: string           // Page ID
  pageTitle?: string        // Page title (alternative to ID)
  spaceKey?: string         // Space key for title lookup
  
  // For create, update operations  
  title?: string            // Page title
  content?: string          // Page content
  contentFormat?: 'storage' | 'view' | 'wiki' // Content format
  parentId?: string         // Parent page ID
  labels?: string[]         // Page labels
  
  // For search operations
  query?: string            // Search query (CQL or text)
  searchSpace?: string      // Limit search to space
  searchType?: 'page' | 'blogpost' | 'attachment' | 'space'
  
  // For list operations
  spaceKeys?: string[]      // Spaces to list content from
  contentType?: 'page' | 'blogpost'
  orderBy?: 'title' | 'created' | 'modified'
  
  // For attachment operations
  attachmentId?: string     // Attachment ID
  filename?: string         // Attachment filename
  
  // Common options
  expand?: string[]         // Fields to expand in response
  limit?: number            // Result limit (default: 25)
  start?: number            // Pagination start (default: 0)
}
```

### Tool Output Schema
```typescript
interface ConfluenceToolOutput {
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
```

## Entity Relationships

### Hierarchical Relationships
```
Space (1) ──→ (N) Pages
Page (1) ──→ (N) Child Pages  
Page (1) ──→ (N) Attachments
Page (N) ──→ (N) Labels
Space (N) ──→ (N) Labels
```

### User Relationships
```
User (1) ──→ (N) Created Pages
User (1) ──→ (N) Created Spaces
User (1) ──→ (N) Page Versions
User (N) ──→ (N) Space Permissions
```

### Content Relationships
```
Page ──→ Version History
Page ──→ Content Formats (storage, view, export)
Page ──→ Restrictions (read, update)
Attachment ──→ Parent Page
Search ──→ Multiple Content Types
```

## Data Validation Rules

### Required Fields
- **Page**: id, type, status, title, space, version
- **Space**: id, key, name, type, status
- **Attachment**: id, type, status, title, container
- **User**: type (minimum requirement)

### Format Constraints
- **Page ID**: Numeric string
- **Space Key**: Alphanumeric, uppercase, no spaces
- **Content**: Valid HTML/XHTML for storage format
- **Timestamps**: ISO 8601 format
- **URLs**: Valid HTTP/HTTPS URLs

### Business Rules
- Page titles must be unique within a space
- Space keys must be globally unique
- Version numbers increment sequentially
- Deleted content has 'trashed' status
- Anonymous users have limited metadata

---

**Data Model Status**: ✅ Complete  
**Next Phase**: API contracts and tool interface
