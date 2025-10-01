# Confluence API Contract

**Feature**: Confluence Tool Integration  
**Date**: 2025-01-02  
**Status**: Complete

## API Client Interface

### Core API Client
```typescript
interface ConfluenceApiClient {
  // Configuration
  configure(config: ConfluenceInstance): void
  validateConfig(): Promise<boolean>
  
  // Content Operations
  getPage(pageId: string, expand?: string[]): Promise<ConfluencePage>
  getPageByTitle(spaceKey: string, title: string, expand?: string[]): Promise<ConfluencePage>
  createPage(pageData: CreatePageRequest): Promise<ConfluencePage>
  updatePage(pageId: string, pageData: UpdatePageRequest): Promise<ConfluencePage>
  deletePage(pageId: string): Promise<void>
  
  // Space Operations
  getSpaces(options?: ListSpacesOptions): Promise<ConfluenceSpace[]>
  getSpace(spaceKey: string, expand?: string[]): Promise<ConfluenceSpace>
  getSpaceContent(spaceKey: string, options?: ContentListOptions): Promise<ConfluencePage[]>
  
  // Search Operations
  search(query: SearchQuery): Promise<SearchResult>
  searchContent(text: string, options?: SearchOptions): Promise<SearchResult>
  
  // Attachment Operations
  getAttachments(pageId: string): Promise<ConfluenceAttachment[]>
  getAttachment(attachmentId: string): Promise<ConfluenceAttachment>
  uploadAttachment(pageId: string, file: AttachmentUpload): Promise<ConfluenceAttachment>
  downloadAttachment(attachmentId: string): Promise<Buffer>
}
```

### Request/Response Types

#### Page Operations
```typescript
interface CreatePageRequest {
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

interface UpdatePageRequest {
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

interface ContentListOptions {
  type?: 'page' | 'blogpost'
  status?: 'current' | 'trashed' | 'historical' | 'draft'
  orderby?: 'title' | 'created' | 'modified'
  start?: number
  limit?: number
  expand?: string[]
}
```

#### Search Operations
```typescript
interface SearchOptions {
  spaceKey?: string
  type?: 'page' | 'blogpost' | 'attachment' | 'space'
  start?: number
  limit?: number
  excerpt?: 'indexed' | 'highlight' | 'none'
}

interface SearchQuery {
  cql: string
  cqlcontext?: string
  excerpt?: 'indexed' | 'highlight' | 'none'
  expand?: string[]
  start?: number
  limit?: number
  includeArchivedSpaces?: boolean
}
```

#### Attachment Operations
```typescript
interface AttachmentUpload {
  filename: string
  content: Buffer
  contentType: string
  comment?: string
}

interface ListSpacesOptions {
  type?: 'global' | 'personal'
  status?: 'current' | 'archived'
  label?: string
  favourite?: boolean
  start?: number
  limit?: number
  expand?: string[]
}
```

## HTTP Client Contract

### Request Configuration
```typescript
interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string | Buffer
  timeout?: number
  retries?: number
}

interface ApiResponse<T = any> {
  status: number
  statusText: string
  headers: Record<string, string>
  data: T
}
```

### Authentication Headers
```typescript
// Confluence Cloud
const cloudAuth = {
  'Authorization': `Basic ${base64(email + ':' + apiToken)}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Confluence Server
const serverAuth = {
  'Authorization': `Basic ${base64(username + ':' + password)}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

### Error Response Format
```typescript
interface ConfluenceApiError {
  statusCode: number
  message: string
  reason?: string
  errors?: Array<{
    field?: string
    message: string
  }>
}
```

## API Endpoint Specifications

### Content Endpoints
```
GET    /rest/api/content                     # List content
GET    /rest/api/content/{id}               # Get content by ID
POST   /rest/api/content                    # Create content
PUT    /rest/api/content/{id}               # Update content
DELETE /rest/api/content/{id}               # Delete content

GET    /rest/api/content/search             # Search content
GET    /rest/api/content/{id}/child         # Get child content
GET    /rest/api/content/{id}/descendant    # Get descendant content
```

### Space Endpoints
```
GET    /rest/api/space                      # List spaces
GET    /rest/api/space/{spaceKey}           # Get space by key
POST   /rest/api/space                      # Create space
PUT    /rest/api/space/{spaceKey}           # Update space
DELETE /rest/api/space/{spaceKey}           # Delete space

GET    /rest/api/space/{spaceKey}/content   # Get space content
```

### Attachment Endpoints
```
GET    /rest/api/content/{id}/child/attachment        # List attachments
GET    /rest/api/content/{id}/child/attachment/{id}   # Get attachment
POST   /rest/api/content/{id}/child/attachment        # Upload attachment
PUT    /rest/api/content/{id}/child/attachment/{id}   # Update attachment
DELETE /rest/api/content/{id}/child/attachment/{id}   # Delete attachment

GET    /download/attachments/{id}/{filename}          # Download attachment
```

### Search Endpoints
```
GET    /rest/api/search                     # CQL search
GET    /rest/api/content/search             # Content search (deprecated)
```

## Rate Limiting Contract

### Rate Limit Headers
```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': string      // Requests per time window
  'X-RateLimit-Remaining': string  // Remaining requests
  'X-RateLimit-Reset': string      // Reset timestamp
  'Retry-After': string            // Seconds to wait (429 responses)
}
```

### Rate Limit Handling
```typescript
interface RateLimitStrategy {
  detectRateLimit(response: ApiResponse): boolean
  calculateBackoff(attempt: number): number
  shouldRetry(error: ConfluenceApiError, attempt: number): boolean
  maxRetries: number
  baseDelay: number
}
```

## Error Handling Contract

### Error Categories
```typescript
enum ConfluenceErrorType {
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

interface ConfluenceError extends Error {
  type: ConfluenceErrorType
  statusCode?: number
  response?: ApiResponse
  retryable: boolean
  userMessage: string
}
```

### Error Recovery Contract
```typescript
interface ErrorRecovery {
  // Authentication errors
  handleAuthError(error: ConfluenceError): Promise<void>
  
  // Rate limit errors  
  handleRateLimit(error: ConfluenceError): Promise<void>
  
  // Network errors
  handleNetworkError(error: ConfluenceError): Promise<void>
  
  // Validation errors
  handleValidationError(error: ConfluenceError): string
  
  // Conflict errors (version conflicts)
  handleConflictError(error: ConfluenceError): Promise<void>
}
```

## Testing Contract

### Mock API Responses
```typescript
interface MockApiClient extends ConfluenceApiClient {
  // Mock response setup
  mockGetPage(pageId: string, response: ConfluencePage): void
  mockCreatePage(request: CreatePageRequest, response: ConfluencePage): void
  mockUpdatePage(pageId: string, request: UpdatePageRequest, response: ConfluencePage): void
  mockSearch(query: SearchQuery, response: SearchResult): void
  
  // Error simulation
  mockError(operation: string, error: ConfluenceError): void
  mockRateLimit(operation: string, retryAfter: number): void
  mockNetworkError(operation: string): void
  
  // State verification
  getRequestHistory(): ApiRequest[]
  clearRequestHistory(): void
}
```

### Test Scenarios
```typescript
interface TestScenario {
  name: string
  setup: () => void
  execute: () => Promise<any>
  verify: (result: any) => void
  cleanup?: () => void
}

// Required test scenarios
const requiredTests: TestScenario[] = [
  // Authentication tests
  'valid_cloud_authentication',
  'valid_server_authentication', 
  'invalid_credentials',
  'expired_token',
  
  // Content operation tests
  'get_existing_page',
  'get_nonexistent_page',
  'create_page_success',
  'create_page_validation_error',
  'update_page_success',
  'update_page_conflict',
  
  // Search tests
  'search_with_results',
  'search_no_results',
  'search_with_filters',
  
  // Error handling tests
  'network_timeout',
  'rate_limit_backoff',
  'server_error_retry',
  'validation_error_handling'
]
```

## Performance Contract

### Response Time Requirements
```typescript
interface PerformanceRequirements {
  getPage: 2000        // 2 seconds max
  createPage: 5000     // 5 seconds max
  updatePage: 5000     // 5 seconds max
  search: 10000        // 10 seconds max
  listContent: 5000    // 5 seconds max
  uploadAttachment: 30000  // 30 seconds max
}
```

### Caching Contract
```typescript
interface CacheStrategy {
  // Cache keys
  pageKey(pageId: string): string
  spaceKey(spaceKey: string): string
  searchKey(query: string): string
  
  // Cache operations
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  
  // Cache policies
  pageTTL: 300000      // 5 minutes
  spaceTTL: 900000     // 15 minutes  
  searchTTL: 60000     // 1 minute
}
```

---

**API Contract Status**: ✅ Complete  
**Test Coverage**: All endpoints and error scenarios defined  
**Next Phase**: Tool interface contracts
