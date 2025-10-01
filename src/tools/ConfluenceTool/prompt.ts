// Confluence Tool Prompts and Descriptions

export const TOOL_NAME_FOR_PROMPT = 'confluence'

export const DESCRIPTION = `The Confluence tool enables comprehensive content management operations with Atlassian Confluence instances. It supports both Confluence Cloud and Server deployments with robust authentication, error handling, and multi-instance configuration.

## Core Capabilities

### Content Operations
- **Get Pages**: Retrieve page content by ID or title+space with flexible expansion options
- **Create Pages**: Create new pages with rich content, metadata, labels, and hierarchical positioning
- **Update Pages**: Modify existing pages with version conflict detection and resolution
- **Content Formats**: Support for storage, view, wiki, HTML, and markdown formats with automatic conversion

### Discovery & Search
- **Full-Text Search**: Advanced search using Confluence Query Language (CQL) with filtering and highlighting
- **Space Management**: List, browse, and manage Confluence spaces with permissions and metadata
- **Content Listing**: Browse space content with sorting, filtering, and pagination
- **Hierarchical Navigation**: Navigate page hierarchies and parent-child relationships

### Advanced Features
- **Attachment Management**: List, download, and upload file attachments with metadata
- **Multi-Instance Support**: Configure and switch between multiple Confluence instances
- **Intelligent Caching**: Performance optimization with TTL-based caching for frequently accessed content
- **Rate Limit Handling**: Automatic retry logic with exponential backoff for API rate limits

## Authentication & Configuration

### Confluence Cloud
- Uses email + API token authentication
- Supports Atlassian Cloud API endpoints
- Automatic detection of Cloud vs Server instances

### Confluence Server/Data Center
- Uses username + password/token authentication
- Supports on-premises Confluence installations
- Compatible with Personal Access Tokens (PATs)

### Multi-Instance Configuration
Configure multiple Confluence instances in your .kode.json:
\`\`\`json
{
  "confluence": {
    "instances": {
      "company": {
        "baseUrl": "https://company.atlassian.net/wiki",
        "email": "user@company.com",
        "apiToken": "your-api-token",
        "type": "cloud"
      },
      "internal": {
        "baseUrl": "https://confluence.internal.com",
        "username": "user",
        "apiToken": "your-token",
        "type": "server"
      }
    },
    "defaultInstance": "company"
  }
}
\`\`\`

## Operation Examples

### Page Management
- \`confluence get --page-id "123456" --expand "body.storage,version"\`
- \`confluence create --title "New Page" --space-key "DOCS" --content "<p>Content</p>"\`
- \`confluence update --page-id "123456" --title "Updated Title"\`

### Search & Discovery
- \`confluence search --query "project documentation" --search-space "DOCS"\`
- \`confluence list --space-key "DOCS" --content-type "page" --order-by "modified"\`
- \`confluence spaces --type "global" --status "current"\`

### Advanced Operations
- \`confluence attachments --page-id "123456"\`
- \`confluence search --query 'space = "DOCS" AND created >= "2024-01-01"'\`

## Error Handling & Recovery

The tool provides comprehensive error handling with user-friendly messages:
- **Authentication Errors**: Clear guidance for credential issues
- **Permission Errors**: Specific information about access requirements
- **Rate Limiting**: Automatic retry with backoff and user notification
- **Network Issues**: Timeout handling and connection retry logic
- **Validation Errors**: Detailed field-level validation feedback

## Performance & Reliability

- **Intelligent Caching**: Reduces API calls with configurable TTL caching
- **Request Optimization**: Efficient pagination and selective field expansion
- **Concurrent Safety**: Thread-safe operations for parallel execution
- **Resource Management**: Automatic cleanup and memory management
- **Constitutional Compliance**: Follows first principles engineering and empirical validation

## Integration Features

- **Kode Permission System**: Secure tool access with user approval for write operations
- **Test Tool Integration**: Interactive testing with predefined examples
- **Multi-Format Support**: Seamless content format conversion and handling
- **Constitutional Alignment**: Designed for autonomous problem solving and simplicity

The Confluence tool is designed for both interactive use and automation workflows, providing reliable access to Confluence content with enterprise-grade error handling and performance optimization.`
