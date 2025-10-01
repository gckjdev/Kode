# Confluence Tool

Comprehensive Confluence integration for content management operations with Atlassian Confluence instances. Supports both Confluence Cloud and Server deployments with robust authentication, error handling, and multi-instance configuration.

## Features

### Core Capabilities
- **Content Management**: Get, create, and update Confluence pages with rich content support
- **Search & Discovery**: Advanced search using Confluence Query Language (CQL) with filtering
- **Space Management**: List, browse, and manage Confluence spaces with permissions
- **Attachment Handling**: List, download, and upload file attachments
- **Multi-Instance Support**: Configure and switch between multiple Confluence instances
- **Format Support**: Handle storage, view, wiki, HTML, and markdown content formats

### Advanced Features
- **Intelligent Caching**: Performance optimization with TTL-based caching
- **Rate Limit Handling**: Automatic retry logic with exponential backoff
- **Version Management**: Conflict detection and resolution for concurrent edits
- **Permission Integration**: Secure tool access with Kode permission system
- **Error Recovery**: Comprehensive error handling with actionable user guidance

## Quick Start

### 1. Configuration

Add Confluence configuration to your `.kode.json` file:

```json
{
  "confluence": {
    "instances": {
      "default": {
        "baseUrl": "https://yourcompany.atlassian.net/wiki",
        "email": "your.email@company.com",
        "apiToken": "your-api-token",
        "type": "cloud"
      }
    },
    "defaultInstance": "default"
  }
}
```

### 2. Get API Token

#### Confluence Cloud
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the generated token

#### Confluence Server
Use your username and password, or create a Personal Access Token in your Confluence settings.

### 3. Test Connection

```bash
# Test with a simple operation
confluence spaces --limit 5
```

## Usage Examples

### Page Operations

#### Get Page Content
```bash
# By page ID
confluence get --page-id "123456" --expand "body.storage,version,metadata.labels"

# By title and space
confluence get --page-title "Getting Started" --space-key "DOCS"
```

#### Create New Page
```bash
confluence create \
  --title "My New Documentation Page" \
  --space-key "DOCS" \
  --content "<p>This is the content of my new page.</p>" \
  --labels "documentation,getting-started" \
  --parent-id "789012"
```

#### Update Existing Page
```bash
confluence update \
  --page-id "123456" \
  --title "Updated Page Title" \
  --content "<p>Updated content with <strong>formatting</strong>.</p>" \
  --content-format "storage"
```

### Search and Discovery

#### Text Search
```bash
# Simple text search
confluence search --query "project documentation"

# Search in specific space
confluence search --query "API documentation" --search-space "DEV"

# Filter by content type
confluence search --query "meeting notes" --search-type "page" --limit 20
```

#### Advanced CQL Search
```bash
# Search by space and date
confluence search --query 'space = "DOCS" AND created >= "2024-01-01"'

# Search by labels
confluence search --query 'label = "important" AND space = "PROJ"'

# Complex queries
confluence search --query 'type = "page" AND contributor = "john.doe" AND lastModified >= "2024-12-01"'
```

### Space and Content Management

#### List Spaces
```bash
# List all accessible spaces
confluence spaces

# List with details and pagination
confluence spaces --expand "description,homepage" --limit 10 --start 0
```

#### Browse Space Content
```bash
# List pages in a space
confluence list --space-key "DOCS" --content-type "page" --order-by "modified"

# List across multiple spaces
confluence list --space-keys "DOCS,PROJ,DEV" --limit 50
```

### Attachment Management

#### List Attachments
```bash
confluence attachments --page-id "123456"
```

## Multi-Instance Configuration

Configure multiple Confluence instances for different environments:

```json
{
  "confluence": {
    "instances": {
      "production": {
        "baseUrl": "https://company.atlassian.net/wiki",
        "email": "user@company.com",
        "apiToken": "prod-token",
        "type": "cloud"
      },
      "staging": {
        "baseUrl": "https://staging.company.com/confluence",
        "username": "user",
        "apiToken": "staging-token",
        "type": "server"
      },
      "internal": {
        "baseUrl": "https://confluence.internal.company.com",
        "username": "user",
        "apiToken": "internal-token",
        "type": "server",
        "timeout": 45000,
        "maxRetries": 5
      }
    },
    "defaultInstance": "production"
  }
}
```

Use specific instances:
```bash
confluence get --instance "staging" --page-id "123456"
confluence search --instance "internal" --query "internal documentation"
```

## Content Formats

The tool supports multiple content formats:

### Storage Format (Default)
Confluence's internal XHTML-based format:
```bash
confluence create --title "Test" --space-key "DOCS" \
  --content '<p>Hello <strong>world</strong>!</p>' \
  --content-format "storage"
```

### Wiki Format
Confluence wiki markup:
```bash
confluence create --title "Test" --space-key "DOCS" \
  --content 'h1. Hello World\n\n*Bold text* and _italic text_' \
  --content-format "wiki"
```

### View Format
For display purposes:
```bash
confluence get --page-id "123456" --expand "body.view"
```

## Integration Examples

### With JIRA Tool
```bash
# Get JIRA ticket details
jira get PROJ-123

# Create related documentation
confluence create \
  --title "PROJ-123: Implementation Guide" \
  --space-key "DOCS" \
  --content "<p>Implementation guide for ticket PROJ-123</p>" \
  --labels "jira,implementation,PROJ-123"
```

### Automation Workflows
```bash
#!/bin/bash
# Daily status update
confluence update \
  --page-title "Daily Status Dashboard" \
  --space-key "TEAM" \
  --content "<p>Status for $(date): All systems operational</p>"
```

## Testing

### Interactive Testing
```bash
# Use the test-tool for interactive testing
test-tool

# Navigate to 'confluence' and try predefined examples:
# - Get page by ID
# - Search content
# - List spaces
# - Create test page
```

### Unit Tests
```bash
# Run comprehensive test suite
bun test src/tools/ConfluenceTool/ConfluenceTool.simple.test.ts

# Run validation tests (Node.js fallback)
node src/tools/ConfluenceTool/test-runner.js
```

## Troubleshooting

### Common Issues

#### Authentication Failures
```
Error: Authentication failed
```
**Solutions:**
1. Verify API token is correct and not expired
2. Check email address matches your Atlassian account
3. Ensure token has required permissions
4. For Server: verify username/password combination

#### Page Not Found
```
Error: Page not found: 123456
```
**Solutions:**
1. Verify page ID is correct
2. Check if page exists and is accessible
3. Try searching for the page by title
4. Ensure you have read permissions

#### Permission Denied
```
Error: Insufficient permissions for operation
```
**Solutions:**
1. Check Confluence space permissions
2. Verify user has required access level (view/edit)
3. Contact space administrator if needed
4. Try with a different user account

#### Rate Limiting
```
Error: Rate limit exceeded, retry after 60 seconds
```
**Solutions:**
1. Wait for the specified time before retrying
2. Reduce request frequency in scripts
3. Consider upgrading Confluence plan for higher limits
4. Use caching to reduce API calls

#### Configuration Issues
```
Error: Confluence configuration not found
```
**Solutions:**
1. Ensure `.kode.json` exists in your home directory or project
2. Verify configuration syntax is correct
3. Check that required fields are present
4. Validate JSON syntax

### Debug Mode

Enable verbose logging for troubleshooting:
```bash
# Set verbose mode in .kode.json
{
  "verbose": true,
  "confluence": { ... }
}
```

### Validate Configuration
```bash
# Test connection with a simple operation
confluence spaces --limit 1
```

## Performance Tips

### Optimize API Usage
- Use `--expand` selectively to get only needed data
- Set appropriate `--limit` for list operations
- Implement caching for frequently accessed content
- Use batch operations when possible

### Content Management
- Use storage format for editing operations
- Use view format for display purposes
- Compress large content when uploading
- Validate content size before operations

### Search Optimization
- Use specific CQL queries instead of broad text searches
- Filter by space when possible
- Use appropriate result limits
- Cache search results for repeated queries

## API Reference

### Operations
- `get`: Retrieve page content by ID or title
- `create`: Create new pages with content and metadata
- `update`: Modify existing pages with version control
- `search`: Search content using text or CQL queries
- `list`: Browse space content with filtering and sorting
- `spaces`: List and manage Confluence spaces
- `attachments`: Handle file attachments on pages

### Common Parameters
- `--instance`: Specify Confluence instance (default: "default")
- `--expand`: Fields to expand in API responses
- `--limit`: Maximum results to return (1-100, default: 25)
- `--start`: Pagination offset (default: 0)

### Content Parameters
- `--content-format`: Format for content input (storage/view/wiki)
- `--labels`: Comma-separated list of labels
- `--parent-id`: Parent page ID for hierarchical organization

## Constitutional Compliance

This tool follows Kode's constitutional principles:

- **First Principles Engineering**: Clean, justified architecture without cargo cult practices
- **Simplicity and Minimalism**: Essential operations only, no over-engineering
- **Tool Mastery and Integration**: Deep Confluence API understanding with seamless Kode integration
- **Autonomous Problem Solving**: Comprehensive error handling with clear user guidance
- **Empirical Validation**: Extensive testing with observable behavior and metrics

## Support

For issues and feature requests:
1. Check this documentation and troubleshooting guide
2. Test with the interactive `test-tool`
3. Verify configuration and permissions
4. Check Confluence API documentation for advanced usage

## Version History

- **v1.0.0**: Initial release with full Confluence Cloud/Server support
  - Complete CRUD operations for pages
  - Advanced search with CQL support
  - Multi-instance configuration
  - Comprehensive testing suite
  - Constitutional compliance validation
