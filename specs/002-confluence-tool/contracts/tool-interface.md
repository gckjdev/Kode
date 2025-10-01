# Tool Interface Contract

**Feature**: Confluence Tool Integration  
**Date**: 2025-01-02  
**Status**: Complete

## Kode Tool Interface Compliance

### Tool Implementation Contract
```typescript
export const ConfluenceTool: Tool<ConfluenceInputSchema, ConfluenceOutput> = {
  // Required properties
  name: 'confluence',
  inputSchema: confluenceInputSchema,
  
  // Required methods
  async description(): Promise<string>
  userFacingName(): string
  async isEnabled(): Promise<boolean>
  isReadOnly(): boolean
  isConcurrencySafe(): boolean
  needsPermissions(): boolean
  async prompt(options?: { safeMode?: boolean }): Promise<string>
  
  // Rendering methods
  renderResultForAssistant(output: ConfluenceOutput): string
  renderToolUseMessage(input: ConfluenceInput, options: { verbose: boolean }): string
  renderToolUseRejectedMessage?(): React.ReactElement
  renderToolResultMessage?(output: ConfluenceOutput): React.ReactElement
  
  // Execution method
  async *call(
    input: ConfluenceInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolResult<ConfluenceOutput>, void, unknown>
}
```

### Input Schema Definition
```typescript
const confluenceInputSchema = z.strictObject({
  operation: z.enum(['get', 'create', 'update', 'search', 'list', 'spaces', 'attachments'])
    .describe('The operation to perform'),
  
  instance: z.string().optional()
    .describe('Confluence instance name (default: "default")'),
  
  // Page identification
  pageId: z.string().optional()
    .describe('Page ID for get/update operations'),
  pageTitle: z.string().optional()
    .describe('Page title (alternative to pageId)'),
  spaceKey: z.string().optional()
    .describe('Space key (required for pageTitle lookup)'),
  
  // Content operations
  title: z.string().optional()
    .describe('Page title for create/update operations'),
  content: z.string().optional()
    .describe('Page content body'),
  contentFormat: z.enum(['storage', 'view', 'wiki']).optional()
    .describe('Content format (default: storage)'),
  parentId: z.string().optional()
    .describe('Parent page ID for new pages'),
  labels: z.array(z.string()).optional()
    .describe('Page labels/tags'),
  
  // Search operations
  query: z.string().optional()
    .describe('Search query (CQL or plain text)'),
  searchSpace: z.string().optional()
    .describe('Limit search to specific space'),
  searchType: z.enum(['page', 'blogpost', 'attachment', 'space']).optional()
    .describe('Content type filter for search'),
  
  // List operations
  spaceKeys: z.array(z.string()).optional()
    .describe('Space keys to list content from'),
  contentType: z.enum(['page', 'blogpost']).optional()
    .describe('Content type filter'),
  orderBy: z.enum(['title', 'created', 'modified']).optional()
    .describe('Sort order for results'),
  
  // Attachment operations
  attachmentId: z.string().optional()
    .describe('Attachment ID'),
  filename: z.string().optional()
    .describe('Attachment filename'),
  
  // Common options
  expand: z.array(z.string()).optional()
    .describe('Fields to expand in response'),
  limit: z.number().min(1).max(100).optional()
    .describe('Maximum results to return (default: 25)'),
  start: z.number().min(0).optional()
    .describe('Pagination offset (default: 0)')
})

type ConfluenceInput = z.infer<typeof confluenceInputSchema>
```

### Output Schema Definition
```typescript
interface ConfluenceOutput {
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

## Tool Behavior Contracts

### Tool Properties
```typescript
const toolProperties = {
  name: 'confluence',                    // Tool identifier
  userFacingName: 'Confluence',         // Display name
  isReadOnly: false,                    // Can modify content
  isConcurrencySafe: true,              // Safe for parallel execution
  needsPermissions: true,               // Requires user approval
  isEnabled: true                       // Always available
}
```

### Operation Validation
```typescript
interface OperationValidation {
  get: {
    required: ['pageId'] | ['pageTitle', 'spaceKey']
    optional: ['expand', 'instance']
  }
  
  create: {
    required: ['title', 'content', 'spaceKey']
    optional: ['parentId', 'labels', 'contentFormat', 'instance']
  }
  
  update: {
    required: ['pageId'] | ['pageTitle', 'spaceKey']
    optional: ['title', 'content', 'labels', 'contentFormat', 'instance']
  }
  
  search: {
    required: ['query']
    optional: ['searchSpace', 'searchType', 'limit', 'start', 'instance']
  }
  
  list: {
    required: ['spaceKey'] | ['spaceKeys']
    optional: ['contentType', 'orderBy', 'limit', 'start', 'instance']
  }
  
  spaces: {
    required: []
    optional: ['limit', 'start', 'instance']
  }
  
  attachments: {
    required: ['pageId']
    optional: ['limit', 'start', 'instance']
  }
}
```

### Error Handling Contract
```typescript
interface ErrorHandling {
  // Configuration errors
  configurationMissing(): ConfluenceOutput
  configurationInvalid(details: string): ConfluenceOutput
  instanceNotFound(instance: string): ConfluenceOutput
  
  // Authentication errors
  authenticationFailed(): ConfluenceOutput
  tokenExpired(): ConfluenceOutput
  insufficientPermissions(operation: string): ConfluenceOutput
  
  // Validation errors
  missingRequiredField(field: string): ConfluenceOutput
  invalidFieldValue(field: string, value: any): ConfluenceOutput
  
  // API errors
  pageNotFound(identifier: string): ConfluenceOutput
  spaceNotFound(spaceKey: string): ConfluenceOutput
  versionConflict(pageId: string, currentVersion: number): ConfluenceOutput
  rateLimitExceeded(retryAfter?: number): ConfluenceOutput
  
  // Network errors
  networkTimeout(): ConfluenceOutput
  connectionFailed(url: string): ConfluenceOutput
  serverError(statusCode: number, message: string): ConfluenceOutput
}
```

## Rendering Contracts

### Assistant Result Rendering
```typescript
interface AssistantRendering {
  // Success cases
  renderPageResult(page: ConfluencePage): string
  renderPageList(pages: ConfluencePage[]): string
  renderSpaceList(spaces: ConfluenceSpace[]): string
  renderSearchResults(results: SearchResult): string
  renderAttachmentList(attachments: ConfluenceAttachment[]): string
  
  // Success operations
  renderCreateSuccess(pageId: string, title: string): string
  renderUpdateSuccess(pageId: string, title: string): string
  
  // Error cases
  renderError(error: string): string
  renderConfigurationError(): string
  renderAuthenticationError(): string
  renderNotFoundError(resource: string): string
  renderValidationError(details: string): string
}
```

### User Interface Rendering
```typescript
interface UserRendering {
  // Tool use messages
  renderGetMessage(pageId: string, title?: string): string
  renderCreateMessage(title: string, spaceKey: string): string
  renderUpdateMessage(pageId: string, title?: string): string
  renderSearchMessage(query: string, space?: string): string
  renderListMessage(spaceKey: string): string
  
  // Result messages (React components)
  renderSuccessMessage(operation: string, details?: string): React.ReactElement
  renderErrorMessage(error: string): React.ReactElement
  renderProgressMessage(operation: string): React.ReactElement
}
```

### Content Formatting
```typescript
interface ContentFormatting {
  // Page content formatting
  formatPageSummary(page: ConfluencePage): string
  formatPageContent(content: string, format: 'storage' | 'view'): string
  formatPageMetadata(page: ConfluencePage): string
  
  // List formatting
  formatPageList(pages: ConfluencePage[], showContent: boolean): string
  formatSpaceList(spaces: ConfluenceSpace[]): string
  formatSearchResults(results: SearchResult, showExcerpts: boolean): string
  
  // Utility formatting
  formatTimestamp(timestamp: string): string
  formatFileSize(bytes: number): string
  formatUserInfo(user: UserInfo): string
  truncateContent(content: string, maxLength: number): string
}
```

## Integration Contracts

### Configuration Integration
```typescript
interface ConfigurationIntegration {
  // Configuration loading
  loadGlobalConfig(): Promise<ConfluenceConfig>
  validateConfiguration(config: ConfluenceConfig): ValidationResult
  getInstanceConfig(instanceName: string): ConfluenceInstance | null
  
  // Default configuration
  getDefaultInstance(): string
  setDefaultInstance(instanceName: string): void
  
  // Configuration validation
  validateInstanceConfig(instance: ConfluenceInstance): ValidationResult
  testConnection(instance: ConfluenceInstance): Promise<boolean>
}
```

### Permission Integration
```typescript
interface PermissionIntegration {
  // Permission checking
  needsPermission(operation: string): boolean
  getPermissionMessage(operation: string, input: ConfluenceInput): string
  
  // Permission categories
  readOperations: string[]      // ['get', 'search', 'list', 'spaces']
  writeOperations: string[]     // ['create', 'update']
  attachmentOperations: string[] // ['attachments']
}
```

### Test Tool Integration
```typescript
interface TestToolIntegration {
  // Example test cases
  getExampleInputs(): Record<string, ConfluenceInput>
  
  // Test scenarios
  getTestScenarios(): Array<{
    name: string
    description: string
    input: ConfluenceInput
    expectedBehavior: string
  }>
  
  // Mock responses
  getMockResponses(): Record<string, ConfluenceOutput>
}
```

## Performance Contracts

### Response Time Requirements
```typescript
interface PerformanceContract {
  maxResponseTimes: {
    get: 5000          // 5 seconds
    create: 10000      // 10 seconds
    update: 10000      // 10 seconds
    search: 15000      // 15 seconds
    list: 10000        // 10 seconds
    spaces: 5000       // 5 seconds
    attachments: 5000  // 5 seconds
  }
  
  // Progress reporting
  reportProgress: boolean
  progressInterval: 1000  // 1 second
  
  // Timeout handling
  timeoutBehavior: 'error' | 'partial'
  timeoutMessage: string
}
```

### Memory Usage
```typescript
interface MemoryContract {
  maxContentSize: 10 * 1024 * 1024    // 10MB per page
  maxSearchResults: 1000               // Maximum search results
  maxListResults: 1000                 // Maximum list results
  cacheSize: 100                       // Maximum cached items
  
  // Memory cleanup
  cleanupInterval: 300000              // 5 minutes
  cleanupThreshold: 0.8                // 80% memory usage
}
```

## Testing Contracts

### Unit Test Requirements
```typescript
interface UnitTestContract {
  // Test coverage requirements
  minCoverage: 90                      // 90% code coverage
  
  // Required test categories
  requiredTests: [
    'tool_properties',
    'input_validation', 
    'operation_execution',
    'error_handling',
    'rendering_methods',
    'configuration_loading',
    'permission_checking'
  ]
  
  // Mock requirements
  mockApiClient: boolean
  mockConfiguration: boolean
  mockPermissions: boolean
}
```

### Integration Test Requirements
```typescript
interface IntegrationTestContract {
  // Test scenarios
  requiredScenarios: [
    'end_to_end_page_operations',
    'search_functionality',
    'error_recovery',
    'configuration_validation',
    'permission_enforcement'
  ]
  
  // Test data requirements
  testConfluenceInstance: boolean
  mockApiResponses: boolean
  errorSimulation: boolean
}
```

---

**Tool Interface Contract Status**: ✅ Complete  
**Compliance**: Full Kode Tool interface compliance  
**Next Phase**: Implementation tasks generation
