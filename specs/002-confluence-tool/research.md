# Technical Research: Confluence Tool

**Feature**: Confluence Tool Integration  
**Date**: 2025-01-02  
**Status**: Complete

## API Research

### Confluence REST API Overview
- **Cloud API**: `https://{site}.atlassian.net/wiki/rest/api/`
- **Server API**: `https://{server}/rest/api/`
- **Version**: API v2 (recommended) with v1 fallback support
- **Authentication**: API tokens (Cloud), Basic auth (Server)

### Key API Endpoints
```
GET /content                    # List content/pages
GET /content/{id}              # Get specific page
POST /content                  # Create new page
PUT /content/{id}              # Update existing page
GET /content/search            # Search content
GET /space                     # List spaces
GET /content/{id}/child/attachment  # List attachments
```

### Content Format Types
1. **Storage Format**: Internal Confluence format (XHTML-based)
2. **View Format**: Rendered HTML for display
3. **Export Format**: Clean HTML for external use
4. **Editor Format**: Format used in editor

**Decision**: Support storage format for editing, view format for reading

## Authentication Research

### Confluence Cloud
- **Method**: API Tokens with email
- **Header**: `Authorization: Basic base64(email:token)`
- **Token Generation**: User Settings → Security → API tokens

### Confluence Server/Data Center
- **Method**: Basic Authentication or Personal Access Tokens
- **Header**: `Authorization: Basic base64(username:password)`
- **Alternative**: Bearer tokens for PATs

**Decision**: Support both methods with automatic detection

## Rate Limiting Analysis

### Confluence Cloud Limits
- **Standard**: 10 requests per second per app
- **Premium**: Higher limits available
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Confluence Server Limits
- **Configurable**: Set by administrators
- **Default**: Usually more permissive than Cloud

**Decision**: Implement rate limit detection and backoff strategy

## Content Management Patterns

### Page Hierarchy
```
Space
├── Page (parent)
│   ├── Child Page
│   └── Child Page
│       └── Grandchild Page
└── Page (parent)
    └── Attachments
```

### Version Management
- **Optimistic Locking**: Use version numbers to prevent conflicts
- **Conflict Detection**: Compare version before updates
- **Version History**: Track changes and authors

## Error Handling Strategy

### API Error Categories
1. **Authentication Errors** (401, 403)
2. **Not Found Errors** (404)
3. **Validation Errors** (400)
4. **Rate Limit Errors** (429)
5. **Server Errors** (500+)
6. **Network Errors** (timeout, connection)

### Error Recovery Patterns
```typescript
// Authentication retry with token refresh
// Rate limit backoff with exponential delay
// Network retry with circuit breaker
// Validation error with clear user guidance
```

## Performance Considerations

### Content Size Limits
- **Page Content**: Up to 100MB (theoretical)
- **Practical Limit**: 10MB for good performance
- **Attachments**: Varies by instance configuration

### Caching Strategy
- **Metadata Caching**: Space info, user permissions
- **Content Caching**: Recent page content (with TTL)
- **Search Results**: Cache for repeated queries

**Decision**: Implement simple in-memory caching with TTL

## Security Analysis

### Credential Storage
- **Location**: Global .kode.json configuration
- **Encryption**: Rely on file system permissions
- **Scope**: Per-instance configuration support

### Content Sanitization
- **Input**: Validate and sanitize user content
- **Output**: Safe rendering of Confluence content
- **XSS Prevention**: Proper HTML escaping

### Permission Validation
- **Principle**: Respect Confluence permissions
- **Implementation**: Let API handle authorization
- **Error Handling**: Clear permission error messages

## Integration Patterns

### Tool Interface Compliance
```typescript
interface ConfluenceTool extends Tool {
  name: 'confluence'
  operations: ['get', 'create', 'update', 'search', 'list']
  inputSchema: ConfluenceInputSchema
  // ... standard tool methods
}
```

### Configuration Schema
```json
{
  "confluence": {
    "instances": {
      "default": {
        "baseUrl": "https://company.atlassian.net/wiki",
        "email": "user@company.com",
        "apiToken": "token",
        "type": "cloud"
      },
      "server": {
        "baseUrl": "https://confluence.company.com",
        "username": "user",
        "password": "pass",
        "type": "server"
      }
    },
    "defaultInstance": "default"
  }
}
```

## Testing Strategy

### Unit Testing Approach
- **API Client**: Mock HTTP responses
- **Content Processing**: Test format conversions
- **Error Handling**: Comprehensive error scenarios
- **Configuration**: Validation and loading tests

### Integration Testing
- **Mock API**: Simulate Confluence responses
- **Real API**: Optional tests with test instance
- **Error Scenarios**: Network failures, auth issues

### Performance Testing
- **Large Content**: Test with 10MB+ pages
- **Rate Limiting**: Verify backoff behavior
- **Concurrent Operations**: Test parallel requests

## Technical Decisions Summary

1. **API Version**: Use v2 with v1 fallback
2. **Authentication**: Support both Cloud tokens and Server basic auth
3. **Content Format**: Storage format for editing, view for reading
4. **Rate Limiting**: Implement detection and exponential backoff
5. **Caching**: Simple in-memory with TTL
6. **Error Handling**: Comprehensive categorization with recovery
7. **Configuration**: Multi-instance support in global config
8. **Testing**: Comprehensive unit tests with mock API

## Implementation Priorities

### Phase 1: Core Operations
1. Authentication and configuration
2. Basic page operations (get, create, update)
3. Error handling and validation

### Phase 2: Advanced Features
1. Search functionality
2. Space management
3. Attachment operations

### Phase 3: Optimization
1. Caching implementation
2. Rate limit handling
3. Performance optimization

---

**Research Status**: ✅ Complete  
**Next Phase**: Design and contracts (Phase 1)
